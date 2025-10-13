'use client';

import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { eachDayOfInterval, endOfDay, format, isSameDay, startOfMonth, startOfWeek, startOfDay } from 'date-fns';
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";
import { Info } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

interface Urge {
    timestamp: Timestamp;
    type?: string;
    count?: number;
}

interface UserProfile {
    currency?: string;
    habitDetails?: Record<string, { packCost?: number; itemsPerPack?: number; itemsPerDay?: string | number }>;
}

interface SavingsStatsProps {
    urges: WithId<Urge>[];
    userProfile: UserProfile;
    selectedDate: Date | undefined;
    activeHabit: string;
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

  if (raw.endsWith('+')) return parseInt(raw, 10) || 0;

  const range = raw.replace('–', '-').split('-').map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n));
  if (range.length === 2) return Math.max(range[0], range[1]);

  const num = parseInt(raw.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(num) ? 0 : num;
}


export function SavingsStats({ urges, userProfile, selectedDate, activeHabit }: SavingsStatsProps) {

    const formatMoney = useMemo(() => {
        const currency = userProfile.currency || 'USD';
        const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });
        return (amount: number) => (amount < 0 ? '-' : '') + formatter.format(Math.abs(amount));
    }, [userProfile.currency]);


    const { stats, description } = useMemo(() => {
        const date = selectedDate || new Date();
        const habitsToCalculate = activeHabit === 'All' ? Object.keys(userProfile.habitDetails || {}) : [activeHabit];
        
        const getCostPerItem = (habit: string) => {
            const details = userProfile.habitDetails?.[habit];
            if (!details) return 0;
            const packCost = Number(details.packCost) || 0;
            const itemsPerPack = Number(details.itemsPerPack) || 0;
            if (itemsPerPack === 0) return 0;
            return packCost / itemsPerPack;
        };
        
        const getDailyBaseline = (habit: string) => {
            const details = userProfile.habitDetails?.[habit];
            return parseItemsPerDay(details?.itemsPerDay);
        };
        
        const mappedUrges = urges.map(u => ({ ...u, dt: u.timestamp?.toDate() })).filter(u => u.dt);

        const getUrgeCount = (filteredUrges: typeof mappedUrges) => {
            return filteredUrges.reduce((sum, urge) => sum + (urge.count || 1), 0);
        }

        const calculateExpense = (intervalUrges: typeof mappedUrges) => {
            let totalCost = 0;
            let totalCount = 0;
            intervalUrges.forEach(urge => {
                if (urge.type && habitsToCalculate.includes(urge.type)) {
                    const count = urge.count || 1;
                    totalCount += count;
                    totalCost += count * getCostPerItem(urge.type);
                }
            });
            return { count: totalCount, money: totalCost };
        };

        const dailyUrges = mappedUrges.filter(u => isSameDay(u.dt, date));
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weeklyUrges = mappedUrges.filter(u => u.dt >= weekStart && u.dt <= endOfDay(date));
        const monthStart = startOfMonth(date);
        const monthlyUrges = mappedUrges.filter(u => u.dt >= monthStart && u.dt <= endOfDay(date));
        
        const dailyExpense = calculateExpense(dailyUrges);
        const weeklyExpense = calculateExpense(weeklyUrges);
        const monthlyExpense = calculateExpense(monthlyUrges);

        const calculateNet = (start: Date, end: Date) => {
            let totalNetCount = 0;
            let totalNetMoney = 0;

            const daysInInterval = eachDayOfInterval({ start, end });
            for (const day of daysInInterval) {
                habitsToCalculate.forEach(habit => {
                    const baseline = getDailyBaseline(habit);
                    if (baseline > 0) {
                        const costPerItem = getCostPerItem(habit);
                        const smokesOnDay = getUrgeCount(mappedUrges.filter(u => isSameDay(u.dt, day) && u.type === habit));
                        const netCount = (baseline - smokesOnDay);
                        totalNetCount += netCount;
                        totalNetMoney += netCount * costPerItem;
                    }
                });
            }
            return { netCount: totalNetCount, netMoney: totalNetMoney };
        }
        
        const dailyNet = calculateNet(startOfDay(date), endOfDay(date));
        const weeklyNet = calculateNet(weekStart, endOfDay(date));
        const monthlyNet = calculateNet(monthStart, endOfDay(date));

        let expenseDescription = "Every dollar not spent is a dollar invested in your freedom.";
        if (dailyExpense.count > 0) {
            expenseDescription = `Is this fleeting relief truly worth the price? Each dollar spent is a vote for the addiction.`;
        } else {
             expenseDescription = `A day of perfect savings. This isn't just money; it's reclaimed time, health, and freedom.`;
        }

        let savingsDescription = savingsMessages.moderate;
        if (Object.values(userProfile.habitDetails || {}).every(d => parseItemsPerDay(d.itemsPerDay) === 0)) {
            savingsDescription = savingsMessages.no_baseline;
        } else if (dailyNet.netCount < 0) {
            savingsDescription = savingsMessages.debt;
        } else if (dailyNet.netCount === 0) {
            savingsDescription = savingsMessages.zero;
        } else if (dailyNet.netCount > 10) { // arbitrary threshold for high savings
            savingsDescription = savingsMessages.high;
        } else if (dailyNet.netCount > 0) {
            savingsDescription = savingsMessages.low;
        }

        return {
            stats: {
                expenses: {
                    daily: { count: dailyExpense.count, money: formatMoney(dailyExpense.money) },
                    weekly: { count: weeklyExpense.count, money: formatMoney(weeklyExpense.money) },
                    monthly: { count: monthlyExpense.count, money: formatMoney(monthlyExpense.money) }
                },
                savings: {
                    daily: { count: Math.round(dailyNet.netCount), money: formatMoney(dailyNet.netMoney) },
                    weekly: { count: Math.round(weeklyNet.netCount), money: formatMoney(weeklyNet.netMoney) },
                    monthly: { count: Math.round(monthlyNet.netCount), money: formatMoney(monthlyNet.netMoney) }
                }
            },
            description: {
                expenses: expenseDescription,
                savings: savingsDescription
            }
        };
    }, [urges, userProfile, activeHabit, selectedDate, formatMoney]);

    return (
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <div className="p-4 hover:no-underline [&[data-state=open]]:pb-0">
                         <div className="flex justify-between items-start w-full gap-2">
                            <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline">
                                <div>
                                    <CardTitle>Financials</CardTitle>
                                    <CardDescription className="text-left mt-1">
                                        {description.expenses}
                                    </CardDescription>
                                </div>
                            </AccordionTrigger>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" aria-label="More Info">
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xs">
                                    <DialogHeader>
                                        <DialogTitle>About Financials</DialogTitle>
                                        <DialogDescription>
                                            This card estimates your spending and net savings based on your logged urges and the cost/baseline info from your profile.
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                         </div>
                    </div>
                    <AccordionContent>
                        <div className="space-y-8 p-4 pt-2">
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
                                 <p className="text-xs text-muted-foreground mb-4 px-2 text-center">{description.savings}</p>
                                <div className="grid grid-cols-3 divide-x divide-border">
                                    <StatDisplay label="Daily" value={stats.savings.daily.count} money={stats.savings.daily.money} moneyColor={stats.savings.daily.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                    <StatDisplay label="Weekly" value={stats.savings.weekly.count} money={stats.savings.weekly.money} moneyColor={stats.savings.weekly.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                    <StatDisplay label="Monthly" value={stats.savings.monthly.count} money={stats.savings.monthly.money} moneyColor={stats.savings.monthly.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    )
}
