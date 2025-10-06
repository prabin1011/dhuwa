
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

const expenseMessages = [
    "This is the price of the habit, not just in money, but in future moments.",
    "Each dollar spent is a vote for the addiction. What will you vote for tomorrow?",
    "You're funding your own trap. Can you see the bars you're paying for?",
    "Is this cost truly worth the fleeting relief it promises?"
];

const savingsMessages = [
    "Skipping a single smoke feels small, but this is how freedom begins.",
    "Come on, skip a few. Let's see some real savings build up here.",
    "This number represents moments you chose yourself over the addiction. Let's make it grow.",
    "Each dollar saved is a step away from the trap. Keep walking."
];

const StatDisplay = ({ label, value, money, moneyColor = 'text-primary' }: { label: string, value: number, money: string, moneyColor?: string }) => (
    <div className="flex flex-col items-center">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className={`text-sm font-medium ${moneyColor}`}>{money}</p>
    </div>
);

export function SavingsStats({ urges, userProfile, selectedDate }: SavingsStatsProps) {
    const costPerItem = useMemo(() => {
        const { packCost = 0, itemsPerPack = 1 } = userProfile;
        if (itemsPerPack === 0) return 0;
        return packCost / itemsPerPack;
    }, [userProfile]);

    const { stats, description } = useMemo(() => {
        const date = selectedDate || new Date();
        const moments = userProfile.moments || [];
        
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
        
        let dynamicDescription = expenseMessages[dailyUrgeCount % expenseMessages.length];
        if (dailySavingsAmount > dailyExpenseAmount && dailySavingsAmount > 0) {
            dynamicDescription = savingsMessages[dailySkipped % savingsMessages.length];
        } else if (dailyExpenseAmount === 0 && dailySavingsAmount === 0) {
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
    }, [urges, userProfile.moments, costPerItem, selectedDate]);


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
