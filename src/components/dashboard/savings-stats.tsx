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

    const stats = useMemo(() => {
        const date = selectedDate || new Date();
        const moments = userProfile.moments || [];
        
        // Expense Calculations (based on logged urges)
        const dailyUrges = urges.filter(urge => isSameDay(urge.timestamp.toDate(), date));
        const weeklyUrges = urges.filter(urge => isWithinInterval(urge.timestamp.toDate(), { start: startOfWeek(date), end: endOfWeek(date) }));
        const monthlyUrges = urges.filter(urge => isWithinInterval(urge.timestamp.toDate(), { start: startOfMonth(date), end: endOfMonth(date) }));
        
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

        return {
            expenses: {
                daily: { count: dailyUrges.length, money: formatMoney(dailyUrges.length * costPerItem) },
                weekly: { count: weeklyUrges.length, money: formatMoney(weeklyUrges.length * costPerItem) },
                monthly: { count: monthlyUrges.length, money: formatMoney(monthlyUrges.length * costPerItem) }
            },
            savings: {
                daily: { count: dailySkipped, money: formatMoney(dailySkipped * costPerItem) },
                weekly: { count: weeklySkipped, money: formatMoney(weeklySkipped * costPerItem) },
                monthly: { count: monthlySkipped, money: formatMoney(monthlySkipped * costPerItem) }
            }
        };
    }, [urges, userProfile.moments, costPerItem, selectedDate]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Financials</CardTitle>
                <CardDescription>Your expenses and savings from the journey.</CardDescription>
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
