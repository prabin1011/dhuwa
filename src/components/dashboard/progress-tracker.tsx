'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { format, startOfWeek, startOfMonth, isWithinInterval, parseISO, endOfWeek, endOfMonth } from "date-fns";
import { Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

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
    
    const { progressData, description } = useMemo(() => {
        if (!moments || moments.length === 0) {
            return {
                progressData: {
                    daily: { percentage: 0, label: "Plan moments to see progress" },
                    weekly: { percentage: 0, label: "Plan moments to see progress" },
                    monthly: { percentage: 0, label: "Plan moments to see progress" }
                },
                description: "Plan your smoking moments to start tracking your progress."
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

        let dynamicDescription = "Your success in skipping planned smokes.";
        if (dailyTotalTracked > 0) {
            if (dailyPercentage === 100) {
                dynamicDescription = "A perfect day. You chose freedom every time. Rejoice in this victory.";
            } else if (dailyPercentage >= 50) {
                dynamicDescription = "You won more than you lost today. Each skipped cigarette is a step out of the trap.";
            } else if (dailyPercentage > 0) {
                dynamicDescription = "Progress, not perfection. You proved you don't need it. Build on this.";
            } else {
                dynamicDescription = "Today was a lesson, not a failure. What did you learn from each moment?";
            }
        }


        return {
            progressData: {
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
            },
            description: dynamicDescription
        };

    }, [moments, selectedDate]);

    return (
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <div className="p-4 hover:no-underline [&[data-state=open]]:pb-0">
                         <div className="flex justify-between items-start w-full gap-2">
                            <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline">
                                <div>
                                    <CardTitle>Habit Progress</CardTitle>
                                    <CardDescription>{description}</CardDescription>
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
                                        <DialogTitle>About Habit Progress</DialogTitle>
                                        <DialogDescription>
                                            This card tracks how often you successfully skip or replace your planned smoking moments. The percentage represents the rate of skipped moments versus total moments acted upon (smoked or skipped).
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <AccordionContent>
                        <div className="p-4 pt-2 space-y-4">
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
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
