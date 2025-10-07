
'use client';

import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
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
    itemsPerDay?: string;
}

interface SavingsStatsProps {
    urges: WithId<Urge>[];
    userProfile: UserProfile;
    selectedDate: Date | undefined;
}

const expenseMessages = {
    over_baseline: "You've crossed the line you drew for yourself. This isn't just about money anymore; it's about a promise.",
    near_baseline: "You're approaching your daily limit. Each one from here on out is a choice to break a promise to yourself. Is it worth it?",
    high: "This cost is high, not just in money, but in future moments. You are funding your own trap.",
    moderate: "Is this fleeting relief truly worth the price? Each dollar spent is a vote for the addiction.",
    low: "It seems small, but this is a quiet leak in your financial boat. Are you ready to patch it?",
    zero: "A day of perfect savings. This is what financial freedom starts to feel like. Protect it."
}

const savingsMessages = {
    debt: "This isn't savings; it's a debt. You've borrowed from tomorrow's health for today's fleeting urge. The bill will come due.",
    zero: "You broke even. A hard-fought battle with no ground lost. Tomorrow, we take territory.",
    low: "A small surplus. A single step in the right direction. Now, take another.",
    moderate: "This is a real surplus. You won the day. This feeling is what freedom tastes like. Savor it.",
    high: "Look at this number. This isn't just money; it's reclaimed time, health, and freedom. You are buying back your life.",
    no_baseline: "Set your daily average in your profile to see real savings calculated here."
}


const StatDisplay = ({ label, value, money, moneyColor = 'text-primary' }: { label: string, value: number, money: string, moneyColor?: string }) => (
    <div className="flex flex-col items-center">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className={`text-sm font-medium ${moneyColor}`}>{money}</p>
    </div>
);

function parseItemsPerDay(itemsPerDay?: string): number {
    if (!itemsPerDay) return 0;
    if (itemsPerDay.includes('+')) {
        return parseInt(itemsPerDay.replace('+', ''), 10);
    }
    const parts = itemsPerDay.split('-').map(Number);
    // Use the higher end of the range for a more challenging baseline
    return parts[1] || parts[0] || 0;
}

export function SavingsStats({ urges, userProfile, selectedDate }: SavingsStatsProps) {
    const costPerItem = useMemo(() => {
        const { packCost = 0, itemsPerPack = 1 } = userProfile;
        if (itemsPerPack === 0) return 0;
        return packCost / itemsPerPack;
    }, [userProfile]);

    const { stats, description } = useMemo(() => {
        const date = selectedDate || new Date();
        const dailyBaseline = parseItemsPerDay(userProfile.itemsPerDay);
        
        const getUrgeCount = (filteredUrges: WithId<Urge>[]) => {
            return filteredUrges.reduce((sum, urge) => sum + (urge.count || 1), 0);
        }

        // Expense Calculations (based on logged urges)
        const dailyUrges = urges.filter(urge => isSameDay(urge.timestamp.toDate(), date));
        const weeklyUrges = urges.filter(urge => isWithinInterval(urge.timestamp.toDate(), { start: startOfWeek(date), end: endOfWeek(date) }));
        const monthlyUrges = urges.filter(urge => isWithinInterval(urge.timestamp.toDate(), { start: startOfMonth(date), end: endOfMonth(date) }));
        
        const dailyUrgeCount = getUrgeCount(dailyUrges);
        const weeklyUrgeCount = getUrgeCount(weeklyUrges);
        const monthlyUrgeCount = getUrgeCount(monthlyUrges);

        // Net Savings/Deficit Calculation
        const calculateNet = (start: Date, end: Date) => {
            if (dailyBaseline === 0) return { netCount: 0, netMoney: 0 };
            const intervalDays = eachDayOfInterval({ start, end });
            const totalBaseline = intervalDays.length * dailyBaseline;
            const totalSmoked = getUrgeCount(urges.filter(u => isWithinInterval(u.timestamp.toDate(), { start, end })));
            const netCount = totalBaseline - totalSmoked;
            return { netCount, netMoney: netCount * costPerItem };
        }
        
        const dailyNet = calculateNet(startOfDay(date), endOfDay(date));
        const weeklyNet = calculateNet(startOfWeek(date), endOfWeek(date));
        const monthlyNet = calculateNet(startOfMonth(date), endOfMonth(date));

        const formatMoney = (amount: number) => {
            const prefix = amount < 0 ? "-" : "";
            return `${prefix}$${Math.abs(amount).toFixed(2)}`;
        }
        
        let dynamicDescription = expenseMessages.moderate;

        if (dailyUrgeCount > dailyBaseline && dailyBaseline > 0) {
            dynamicDescription = expenseMessages.over_baseline;
        } else if (dailyUrgeCount >= dailyBaseline * 0.8 && dailyBaseline > 0) {
             dynamicDescription = expenseMessages.near_baseline;
        } else if (dailyUrgeCount > 10) {
            dynamicDescription = expenseMessages.high;
        } else if (dailyUrgeCount > 0) {
             dynamicDescription = expenseMessages.low;
        } else {
            dynamicDescription = expenseMessages.zero;
        }
        
        let savingsDescription = savingsMessages.moderate;
        if (dailyBaseline === 0) {
            savingsDescription = savingsMessages.no_baseline;
        } else if (dailyNet.netCount < 0) {
            savingsDescription = savingsMessages.debt;
        } else if (dailyNet.netCount === 0) {
            savingsDescription = savingsMessages.zero;
        } else if (dailyNet.netCount > 10) {
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
                expenses: dynamicDescription,
                savings: savingsDescription
            }
        };
    }, [urges, userProfile, costPerItem, selectedDate]);


    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
                <Card>
                    <AccordionTrigger className="p-6">
                        <div className="flex flex-col items-start text-left w-full">
                            <CardTitle>Financials</CardTitle>
                            <CardDescription className="text-left">
                                {stats.expenses.daily.count > 0 ? description.expenses : expenseMessages.zero}
                            </CardDescription>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent>
                             <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Expenses (Smokes Logged)</h4>
                                     <div className="grid grid-cols-3 divide-x divide-border">
                                        <StatDisplay label="Daily" value={stats.expenses.daily.count} money={stats.expenses.daily.money} moneyColor="text-destructive" />
                                        <StatDisplay label="Weekly" value={stats.expenses.weekly.count} money={stats.expenses.weekly.money} moneyColor="text-destructive"/>
                                        <StatDisplay label="Monthly" value={stats.expenses.monthly.count} money={stats.expenses.monthly.money} moneyColor="text-destructive"/>
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="text-sm font-semibold mb-1">Net Savings (vs. Your Baseline)</h4>
                                     <p className="text-xs text-muted-foreground mb-2">{description.savings}</p>
                                    <div className="grid grid-cols-3 divide-x divide-border">
                                        <StatDisplay label="Daily" value={stats.savings.daily.count} money={stats.savings.daily.money} moneyColor={stats.savings.daily.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                        <StatDisplay label="Weekly" value={stats.savings.weekly.count} money={stats.savings.weekly.money} moneyColor={stats.savings.weekly.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                        <StatDisplay label="Monthly" value={stats.savings.monthly.count} money={stats.savings.monthly.money} moneyColor={stats.savings.monthly.count < 0 ? 'text-destructive' : 'text-primary'}/>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </AccordionContent>
                </Card>
            </AccordionItem>
        </Accordion>
    )
}
