'use client';

import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { differenceInCalendarWeeks, differenceInCalendarMonths, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";

interface Urge {
    timestamp: Timestamp;
    type?: string;
}

interface UserProfile {
    packCost?: number;
    itemsPerPack?: number;
}

interface SavingsStatsProps {
    urges: WithId<Urge>[];
    userProfile: UserProfile;
    selectedDate: Date | undefined;
}

const StatDisplay = ({ label, value, money }: { label: string, value: number, money: string }) => (
    <div className="flex flex-col items-center">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium text-primary">{money}</p>
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
        
        const dailyUrges = urges.filter(urge => isSameDay(urge.timestamp.toDate(), date));

        const weeklyStart = startOfWeek(date);
        const weeklyEnd = endOfWeek(date);
        const weeklyUrges = urges.filter(urge => isWithinInterval(urge.timestamp.toDate(), { start: weeklyStart, end: weeklyEnd }));

        const monthlyStart = startOfMonth(date);
        const monthlyEnd = endOfMonth(date);
        const monthlyUrges = urges.filter(urge => isWithinInterval(urge.timestamp.toDate(), { start: monthlyStart, end: monthlyEnd }));
        
        const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

        return {
            daily: {
                count: dailyUrges.length,
                money: formatMoney(dailyUrges.length * costPerItem),
            },
            weekly: {
                count: weeklyUrges.length,
                money: formatMoney(weeklyUrges.length * costPerItem),
            },
            monthly: {
                count: monthlyUrges.length,
                money: formatMoney(monthlyUrges.length * costPerItem),
            }
        }
    }, [urges, costPerItem, selectedDate]);


    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-3 divide-x divide-border">
                    <StatDisplay label="Daily" value={stats.daily.count} money={stats.daily.money} />
                    <StatDisplay label="Weekly" value={stats.weekly.count} money={stats.weekly.money} />
                    <StatDisplay label="Monthly" value={stats.monthly.count} money={stats.monthly.money} />
                </div>
            </CardContent>
        </Card>
    )
}
