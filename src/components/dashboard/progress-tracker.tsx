'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { format, startOfWeek, startOfMonth, isWithinInterval, parseISO, endOfWeek, endOfMonth } from "date-fns";
import { Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useTranslations } from "next-intl";

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
    const t = useTranslations('dashboard.progress');
    const moments = userProfile.moments || [];
    
    const { progressData, description } = useMemo(() => {
        if (!moments || moments.length === 0) {
            return {
                progressData: {
                    daily: { percentage: 0, label: t('no_plan') },
                    weekly: { percentage: 0, label: t('no_plan') },
                    monthly: { percentage: 0, label: t('no_plan') }
                },
                description: t('no_plan')
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

        let dynamicDescription = t('description_default');
        if (dailyTotalTracked > 0) {
            if (dailyPercentage === 100) {
                dynamicDescription = t('description_perfect');
            } else if (dailyPercentage >= 50) {
                dynamicDescription = t('description_good');
            } else if (dailyPercentage > 0) {
                dynamicDescription = t('description_progress');
            } else {
                dynamicDescription = t('description_lesson');
            }
        }


        return {
            progressData: {
                daily: {
                    percentage: dailyPercentage,
                    label: t('skipped_on', { skipped: dailySkipped, total: dailyTotalTracked, date: format(selectedDate, 'MMM d') })
                },
                weekly: {
                    percentage: weeklyPercentage,
                    label: t('skipped_this_week', { skipped: weeklyMomentsSkipped, total: weeklyMomentsTracked })
                },
                monthly: {
                    percentage: monthlyPercentage,
                    label: t('skipped_this_month', { skipped: monthlyMomentsSkipped, total: monthlyMomentsTracked })
                }
            },
            description: dynamicDescription
        };

    }, [moments, selectedDate, t]);

    return (
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <div className="flex justify-between items-start w-full gap-2 p-4 hover:no-underline [&[data-state=open]]:pb-0">
                        <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline">
                            <div>
                                <CardTitle>{t('title')}</CardTitle>
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
                    <AccordionContent>
                        <div className="p-4 pt-2 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{useTranslations('dashboard.financials')('daily')}</span>
                                    <span className="text-muted-foreground">{progressData.daily.label}</span>
                                </div>
                                <Progress value={progressData.daily.percentage} />
                            </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{useTranslations('dashboard.financials')('weekly')}</span>
                                    <span className="text-muted-foreground">{progressData.weekly.label}</span>
                                </div>
                                <Progress value={progressData.weekly.percentage} />
                            </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{useTranslations('dashboard.financials')('monthly')}</span>
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
