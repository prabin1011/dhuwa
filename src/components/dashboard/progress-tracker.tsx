'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { format, startOfWeek, startOfMonth, isWithinInterval, parseISO, endOfWeek, endOfMonth, endOfDay } from "date-fns";

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
}

interface UserProfile {
    moments?: SmokingMoment[];
}

interface ProgressTrackerProps {
    userProfile: UserProfile;
    selectedDate: Date;
}

export function ProgressTracker({ userProfile, selectedDate }: ProgressTrackerProps) {
    const moments = userProfile.moments || [];
    
    const progressData = useMemo(() => {
        if (!moments || moments.length === 0) {
            return {
                daily: { percentage: 0, label: "Plan moments to see progress" },
                weekly: { percentage: 0, label: "Plan moments to see progress" },
                monthly: { percentage: 0, label: "Plan moments to see progress" }
            };
        }

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        const dailyPlanned = moments.length;
        const dailySkipped = moments.filter(m => m.completed?.[dateStr] === false).length;
        const dailySmoked = moments.filter(m => m.completed?.[dateStr] === true).length;
        const dailyTotalTracked = dailySkipped + dailySmoked;
        const dailyPercentage = dailyTotalTracked > 0 ? (dailySkipped / dailyTotalTracked) * 100 : 0;
        
        const weeklyStart = startOfWeek(selectedDate);
        const weeklyEnd = endOfWeek(selectedDate);
        const monthlyStart = startOfMonth(selectedDate);
        const monthlyEnd = endOfMonth(selectedDate);

        const weeklyMomentsTracked = moments.reduce((acc, m) => {
            return acc + Object.keys(m.completed || {}).filter(d => isWithinInterval(parseISO(d), {start: weeklyStart, end: weeklyEnd})).length
        }, 0);
        const weeklyMomentsSkipped = moments.reduce((acc, m) => {
             return acc + Object.keys(m.completed || {}).filter(d => isWithinInterval(parseISO(d), {start: weeklyStart, end: weeklyEnd}) && m.completed[d] === false).length
        }, 0);
        const weeklyPercentage = weeklyMomentsTracked > 0 ? (weeklyMomentsSkipped / weeklyMomentsTracked) * 100 : 0;

        const monthlyMomentsTracked = moments.reduce((acc, m) => {
            return acc + Object.keys(m.completed || {}).filter(d => isWithinInterval(parseISO(d), {start: monthlyStart, end: monthlyEnd})).length
        }, 0);
        const monthlyMomentsSkipped = moments.reduce((acc, m) => {
             return acc + Object.keys(m.completed || {}).filter(d => isWithinInterval(parseISO(d), {start: monthlyStart, end: monthlyEnd}) && m.completed[d] === false).length
        }, 0);
        const monthlyPercentage = monthlyMomentsTracked > 0 ? (monthlyMomentsSkipped / monthlyMomentsTracked) * 100 : 0;


        return {
            daily: {
                percentage: dailyPercentage,
                label: `${dailySkipped}/${dailyTotalTracked} skipped on ${format(selectedDate, 'MMM d')}`
            },
            weekly: {
                percentage: weeklyPercentage,
                label: `${weeklyMomentsSkipped}/${weeklyMomentsTracked} skipped this week`
            },
            monthly: {
                percentage: monthlyPercentage,
                label: `${monthlyMomentsSkipped}/${monthlyMomentsTracked} skipped this month`
            }
        };

    }, [moments, selectedDate]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Habit Progress</CardTitle>
                <CardDescription>Your success in skipping planned smokes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Daily</span>
                        <span className="text-muted-foreground">{progressData.daily.label}</span>
                    </div>
                    <Progress value={progressData.daily.percentage} />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Weekly</span>
                        <span className="text-muted-foreground">{progressData.weekly.label}</span>
                    </div>
                    <Progress value={progressData.weekly.percentage} />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Monthly</span>
                        <span className="text-muted-foreground">{progressData.monthly.label}</span>
                    </div>
                    <Progress value={progressData.monthly.percentage} />
                </div>
            </CardContent>
        </Card>
    );
}
