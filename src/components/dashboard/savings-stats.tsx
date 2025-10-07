
'use client';

import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";

interface Urge {
    timestamp: Timestamp;
    type?: string;
    count?: number;
}

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
}

interface UserProfile {
    packCost?: number;
    itemsPerPack?: number;
    itemsPerDay?: string;
    moments?: SmokingMoment[];
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
    high: "Look at this number. This isn't just money; it's reclaimed time, health, and freedom. You are buying back your life.",
    moderate: "This number represents every time you chose yourself over the addiction. You are building a new you.",
    low: "It starts with one. Skipping a single smoke feels small, but this is how an empire of self-respect is built. Let's see this number grow.",
    zero: "An opportunity awaits. The next urge isn't a threat; it's a chance to make a deposit into your well-being account."
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
    return parts[0] || 0;
}

export function SavingsStats({ urges, userProfile, selectedDate }: SavingsStatsProps) {
    const costPerItem = useMemo(() => {
        const { packCost = 0, itemsPerPack = 1 } = userProfile;
        if (itemsPerPack === 0) return 0;
        return packCost / itemsPerPack;
    }, [userProfile]);

    const { stats, description } = useMemo(() => {
        const date = selectedDate || new Date();
        const moments = userProfile.moments || [];
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
        
        // Savings Calculations (based on skipped planned moments)
        const getSkippedCount = (start: Date, end: Date): number => {
            let count = 0;
            moments.forEach(moment => {
                if (moment.completed) {
                    Object.keys(moment.completed).forEach(dateStr => {
                        if (moment.completed[dateStr] === false && isWithinInterval(parseISO(dateStr), { start, end })) {
                            count++;
                        }
                    });
                }
            });
            return count;
        };

        const dailySkipped = getSkippedCount(date, date);
        const weeklySkipped = getSkippedCount(startOfWeek(date), endOfWeek(date));
        const monthlySkipped = getSkippedCount(startOfMonth(date), endOfMonth(date));

        const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

        const dailyExpenseAmount = dailyUrgeCount * costPerItem;
        const dailySavingsAmount = dailySkipped * costPerItem;
        
        let dynamicDescription = expenseMessages.moderate;

        if (dailyUrgeCount === 0 && dailySavingsAmount === 0) {
            dynamicDescription = expenseMessages.zero;
        } else if (dailySavingsAmount > dailyExpenseAmount) {
             if (dailySavingsAmount > costPerItem * 5) dynamicDescription = savingsMessages.high;
             else if (dailySavingsAmount > costPerItem) dynamicDescription = savingsMessages.moderate;
             else dynamicDescription = savingsMessages.low;
        } else { // Expenses are greater or equal
            if (dailyBaseline > 0 && dailyUrgeCount > dailyBaseline) {
                dynamicDescription = expenseMessages.over_baseline;
            } else if (dailyBaseline > 0 && dailyUrgeCount >= dailyBaseline * 0.8) {
                 dynamicDescription = expenseMessages.near_baseline;
            } else if (dailyUrgeCount > 10) {
                dynamicDescription = expenseMessages.high;
            } else if (dailyUrgeCount > 0) {
                 dynamicDescription = expenseMessages.low;
            }
        }
        if(dailyUrgeCount === 0 && dailySkipped === 0) {
            dynamicDescription = "A quiet day. Every choice matters tomorrow.";
        }


        return {
            stats: {
                expenses: {
                    daily: { count: dailyUrgeCount, money: formatMoney(dailyExpenseAmount) },
                    weekly: { count: weeklyUrgeCount, money: formatMoney(weeklyUrgeCount * costPerItem) },
                    monthly: { count: monthlyUrgeCount, money: formatMoney(monthlyUrgeCount * costPerItem) }
                },
                savings: {
                    daily: { count: dailySkipped, money: formatMoney(dailySavingsAmount) },
                    weekly: { count: weeklySkipped, money: formatMoney(weeklySkipped * costPerItem) },
                    monthly: { count: monthlySkipped, money: formatMoney(monthlySkipped * costPerItem) }
                }
            },
            description: dynamicDescription
        };
    }, [urges, userProfile.moments, costPerItem, selectedDate, userProfile.itemsPerDay]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Financials</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="expenses">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="savings">Savings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="expenses" className="pt-4">
                         <div className="grid grid-cols-3 divide-x divide-border">
                            <StatDisplay label="Daily" value={stats.expenses.daily.count} money={stats.expenses.daily.money} moneyColor="text-destructive" />
                            <StatDisplay label="Weekly" value={stats.expenses.weekly.count} money={stats.expenses.weekly.money} moneyColor="text-destructive"/>
                            <StatDisplay label="Monthly" value={stats.expenses.monthly.count} money={stats.expenses.monthly.money} moneyColor="text-destructive"/>
                        </div>
                    </TabsContent>
                    <TabsContent value="savings" className="pt-4">
                        <div className="grid grid-cols-3 divide-x divide-border">
                            <StatDisplay label="Daily" value={stats.savings.daily.count} money={stats.savings.daily.money} moneyColor="text-primary"/>
                            <StatDisplay label="Weekly" value={stats.savings.weekly.count} money={stats.savings.weekly.money} moneyColor="text-primary"/>
                            <StatDisplay label="Monthly" value={stats.savings.monthly.count} money={stats.savings.monthly.money} moneyColor="text-primary"/>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
