'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { format, startOfWeek, startOfMonth, startOfYear, isWithinInterval, parseISO } from "date-fns";

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
}

const calculateProgress = (moments: SmokingMoment[], interval: { start: Date, end: Date }) => {
    let totalMomentsInInterval = 0;
    let skippedMomentsInInterval = 0;

    // Iterate through each day in the interval
    for (let day = interval.start; day <= interval.end; day.setDate(day.getDate() + 1)) {
        const dateStr = format(day, 'yyyy-MM-dd');
        
        moments.forEach(moment => {
            if (moment.completed) {
                // If a moment has an entry for this date, it was a "plannable" moment
                 if (moment.completed.hasOwnProperty(dateStr)) {
                    totalMomentsInInterval++;
                    // If the entry is false, it was skipped (a success)
                    if (moment.completed[dateStr] === false) {
                        skippedMomentsInInterval++;
                    }
                }
            }
        });
    }
    
    // Reset day to the end of interval to not affect other calculations
    day.setDate(interval.end.getDate());


    if (totalMomentsInInterval === 0) return { percentage: 0, label: "No data" };
    
    const percentage = (skippedMomentsInInterval / totalMomentsInInterval) * 100;
    
    return {
        percentage,
        label: `${skippedMomentsInInterval} / ${totalMomentsInInterval} skipped`
    };
};


export function ProgressTracker({ userProfile }: ProgressTrackerProps) {

    const moments = userProfile.moments || [];
    
    const progressData = useMemo(() => {
        if (!moments || moments.length === 0) {
            return {
                daily: { percentage: 0, label: "Plan moments to see progress" },
                weekly: { percentage: 0, label: "Plan moments to see progress" },
                monthly: { percentage: 0, label: "Plan moments to see progress" }
            };
        }

        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');

        const dailyPlanned = moments.length;
        const dailySkipped = moments.filter(m => m.completed?.[todayStr] === false).length;
        const dailySmoked = moments.filter(m => m.completed?.[todayStr] === true).length;
        const dailyTotalTracked = dailySkipped + dailySmoked;
        const dailyPercentage = dailyTotalTracked > 0 ? (dailySkipped / dailyTotalTracked) * 100 : 0;
        
        const weeklyStart = startOfWeek(now);
        const monthlyStart = startOfMonth(now);

        const weeklyMomentsTracked = moments.reduce((acc, m) => {
            return acc + Object.keys(m.completed || {}).filter(dateStr => isWithinInterval(parseISO(dateStr), {start: weeklyStart, end: now})).length
        }, 0);
        const weeklyMomentsSkipped = moments.reduce((acc, m) => {
             return acc + Object.keys(m.completed || {}).filter(dateStr => isWithinInterval(parseISO(dateStr), {start: weeklyStart, end: now}) && m.completed[dateStr] === false).length
        }, 0);
        const weeklyPercentage = weeklyMomentsTracked > 0 ? (weeklyMomentsSkipped / weeklyMomentsTracked) * 100 : 0;

        const monthlyMomentsTracked = moments.reduce((acc, m) => {
            return acc + Object.keys(m.completed || {}).filter(dateStr => isWithinInterval(parseISO(dateStr), {start: monthlyStart, end: now})).length
        }, 0);
        const monthlyMomentsSkipped = moments.reduce((acc, m) => {
             return acc + Object.keys(m.completed || {}).filter(dateStr => isWithinInterval(parseISO(dateStr), {start: monthlyStart, end: now}) && m.completed[dateStr] === false).length
        }, 0);
        const monthlyPercentage = monthlyMomentsTracked > 0 ? (monthlyMomentsSkipped / monthlyMomentsTracked) * 100 : 0;


        return {
            daily: {
                percentage: dailyPercentage,
                label: `${dailySkipped}/${dailyTotalTracked} skipped today`
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

    }, [moments]);

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
