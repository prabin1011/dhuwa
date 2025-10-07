
'use client';

import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isSameDay, startOfWeek, startOfMonth, eachDayOfInterval, endOfDay, startOfDay, format } from 'date-fns';
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";

interface Urge {
    timestamp: Timestamp;
    type?: string;
    count?: number;
}

interface UserProfile {
    packCost?: number;
    itemsPerPack?: number;
    itemsPerDay?: string | number;
}

interface SavingsStatsProps {
    urges: WithId<Urge>[];
    userProfile: UserProfile;
    selectedDate: Date | undefined;
}

const expenseMessages = {
    over_baseline: "You've crossed the line you drew for yourself. This isn't just about money; it's about a promise.",
    near_baseline: "You're approaching your daily limit. Each one from here on out is a choice to break your promise to yourself.",
    high: "This cost is high, not just in money, but in future moments. You are funding your own trap.",
    moderate: "Is this fleeting relief truly worth the price? Each dollar spent is a vote for the addiction.",
    low: "It seems small, but this is a quiet leak in your financial boat. You can still patch it.",
    zero: "A day of perfect savings. This is what financial freedom starts to feel like. Protect it."
}

const savingsMessages = {
    debt: "This isn't savings; it's a debt. You've borrowed from tomorrow's health for today's fleeting urge. The bill will come due.",
    zero: "You broke even. A hard-fought battle with no ground lost. Tomorrow, we take territory.",
    low: "A small surplus. A single step in the right direction. Now, take another.",
    moderate: "This is a real surplus. You won the day. This feeling is what freedom tastes like. Savor it.",
    high: "Look at this number. This isn't just money; it's reclaimed time, health, and freedom. You are buying back your life.",
    no_baseline: "Set your daily average in your profile to see your net savings calculated against your baseline."
}

const StatDisplay = ({ label, value, money, moneyColor = 'text-primary' }: { label: string, value: number, money: string, moneyColor?: string }) => (
    <div className="flex flex-col items-center">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className={`text-sm font-medium ${moneyColor}`}>{money}</p>
    </div>
);

function parseItemsPerDay(itemsPerDay?: string | number): number {
  if (itemsPerDay == null) return 0;
  if (typeof itemsPerDay === 'number') return Math.max(0, Math.floor(itemsPerDay));

  const raw = String(itemsPerDay).trim();

  // "10+" -> 10
  if (raw.endsWith('+')) return parseInt(raw, 10) || 0;

  // "8-12" -> 12, "8–12" (en dash) -> 12
  const range = raw.replace('–', '-').split('-').map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n));
  if (range.length === 2) return Math.max(range[0], range[1]);

  // "10/day", "10 per day" -> 10
  const num = parseInt(raw.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(num) ? 0 : num;
}

const fmtMoney = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const formatMoney = (amount: number) => (amount < 0 ? '-' : '') + fmtMoney.format(Math.abs(amount));

export function SavingsStats({ urges, userProfile, selectedDate }: SavingsStatsProps) {
    const costPerItem = useMemo(() => {
        const { packCost = 0, itemsPerPack = 1 } = userProfile;
        if (itemsPerPack === 0) return 0;
        return packCost / itemsPerPack;
    }, [userProfile]);

    const { stats, description } = useMemo(() => {
        const date = selectedDate || new Date();
        const dailyBaseline = parseItemsPerDay(userProfile.itemsPerDay);
        
        const mappedUrges = urges.map(u => ({ ...u, dt: u.timestamp?.toDate() })).filter(u => u.dt);

        const getUrgeCount = (filteredUrges: typeof mappedUrges) => {
            return filteredUrges.reduce((sum, urge) => sum + (urge.count || 1), 0);
        }

        // --- Expense Calculations (to-date) ---
        const dailyUrges = mappedUrges.filter(u => isSameDay(u.dt, date));
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weeklyUrges = mappedUrges.filter(u => u.dt >= weekStart && u.dt <= endOfDay(date));
        const monthStart = startOfMonth(date);
        const monthlyUrges = mappedUrges.filter(u => u.dt >= monthStart && u.dt <= endOfDay(date));
        
        const dailyUrgeCount = getUrgeCount(dailyUrges);
        const weeklyUrgeCount = getUrgeCount(weeklyUrges);
        const monthlyUrgeCount = getUrgeCount(monthlyUrges);
        
        // --- Net Savings/Deficit Calculation (to-date) ---
        const calculateNet = (start: Date, end: Date) => {
            if (dailyBaseline === 0) return { netCount: 0, netMoney: 0 };
            
            const daysInInterval = eachDayOfInterval({ start, end });
            let totalNetCount = 0;

            for (const day of daysInInterval) {
                const smokesOnDay = getUrgeCount(mappedUrges.filter(u => isSameDay(u.dt, day)));
                totalNetCount += (dailyBaseline - smokesOnDay);
            }
            
            return { netCount: totalNetCount, netMoney: totalNetCount * costPerItem };
        }
        
        const dailyNet = calculateNet(startOfDay(date), endOfDay(date));
        const weeklyNet = calculateNet(weekStart, endOfDay(date));
        const monthlyNet = calculateNet(monthStart, endOfDay(date));

        // --- Descriptions ---
        let expenseDescription = expenseMessages.moderate;
        if (dailyBaseline > 0) {
            if (dailyUrgeCount > dailyBaseline) {
                expenseDescription = expenseMessages.over_baseline;
            } else if (dailyUrgeCount >= dailyBaseline * 0.8) {
                expenseDescription = expenseMessages.near_baseline;
            } else if (dailyUrgeCount === 0) {
                expenseDescription = expenseMessages.zero;
            } else {
                expenseDescription = expenseMessages.low;
            }
        } else if (dailyUrgeCount > 0) {
            expenseDescription = expenseMessages.low;
        } else {
            expenseDescription = expenseMessages.zero;
        }
        
        let savingsDescription = savingsMessages.moderate;
        if (dailyBaseline === 0) {
            savingsDescription = savingsMessages.no_baseline;
        } else if (dailyNet.netCount < 0) {
            savingsDescription = savingsMessages.debt;
        } else if (dailyNet.netCount === 0) {
            savingsDescription = savingsMessages.zero;
        } else if (dailyNet.netCount > dailyBaseline * 2) { // Saved more than 2 days worth
            savingsDescription = savingsMessages.high;
        } else if (dailyNet.netCount > 0) {
            savingsDescription = savingsMessages.low;
        }

        return {
            stats: {
                expenses: {
                    daily: { count: dailyUrgeCount, money: formatMoney(dailyUrgeCount * costPerItem) },
                    weekly: { count: weeklyUrgeCount, money: formatMoney(weeklyUrgeCount * costPerItem) },
                    monthly: { count: monthlyUrgeCount, money: formatMoney(monthlyUrgeCount * costPerItem) }
                },
                savings: {
                    daily: { count: dailyNet.netCount, money: formatMoney(dailyNet.netMoney) },
                    weekly: { count: weeklyNet.netCount, money: formatMoney(weeklyNet.netMoney) },
                    monthly: { count: monthlyNet.netCount, money: formatMoney(monthlyNet.netMoney) }
                }
            },
            description: {
                expenses: expenseDescription,
                savings: savingsDescription
            }
        };
    }, [urges, userProfile, costPerItem, selectedDate]);

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
                <Card>
                    <AccordionTrigger className="p-4 text-left">
                        <div className="flex flex-col items-start w-full">
                            <CardTitle>Financials</CardTitle>
                            <CardDescription className="text-left mt-1">
                                {description.expenses}
                            </CardDescription>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent className="space-y-6">
                             <div>
                                <h4 className="text-sm font-semibold mb-4 text-center">Expenses (to-date)</h4>
                                 <div className="grid grid-cols-3 divide-x divide-border">
                                    <StatDisplay label="Daily" value={stats.expenses.daily.count} money={stats.expenses.daily.money} moneyColor="text-destructive" />
                                    <StatDisplay label="Weekly" value={stats.expenses.weekly.count} money={stats.expenses.weekly.money} moneyColor="text-destructive"/>
                                    <StatDisplay label="Monthly" value={stats.expenses.monthly.count} money={stats.expenses.monthly.money} moneyColor="text-destructive"/>
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold mb-2 text-center">Net Savings vs Baseline (to-date)</h4>
                                 <p className="text-xs text-muted-foreground mb-4 px-2">{description.savings}</p>
                                <div className="grid grid-cols-3 divide-x divide-border">
                                    <StatDisplay label="Daily" value={stats.savings.daily.count} money={stats.savings.daily.money} moneyColor={stats.savings.daily.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                    <StatDisplay label="Weekly" value={stats.savings.weekly.count} money={stats.savings.weekly.money} moneyColor={stats.savings.weekly.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                    <StatDisplay label="Monthly" value={stats.savings.monthly.count} money={stats.savings.monthly.money} moneyColor={stats.savings.monthly.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                </div>
                            </div>
                        </CardContent>
                    </AccordionContent>
                </Card>
            </AccordionItem>
        </Accordion>
    )
}

    
