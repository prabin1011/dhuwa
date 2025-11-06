'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { format } from 'date-fns';
import { Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useTranslations } from 'next-intl';

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, { activity: string; mood?: string; }>;
}

interface UserProfile {
    moments?: SmokingMoment[];
}

interface ReplacementMoodReportProps {
    userProfile: UserProfile;
    selectedDate: Date;
}

const COLORS: Record<string, string> = {
    proud: 'hsl(var(--chart-5))',
    hopeful: 'hsl(var(--chart-2))',
    calm: 'hsl(var(--chart-4))',
    uneasy: 'hsl(var(--chart-1))',
    distracted: 'hsl(var(--chart-3))',
    neutral: 'hsl(var(--secondary))',
    default: 'hsl(var(--muted))'
};

const getMoodColor = (mood: string) => COLORS[mood] || COLORS.default;

export function ReplacementMoodReport({ userProfile, selectedDate }: ReplacementMoodReportProps) {
    const t = useTranslations('dashboard.replacementMood');

    const { moodData, description } = useMemo(() => {
        const moodCount: Record<string, number> = {};
        let totalReplacements = 0;

        (userProfile.moments || []).forEach(moment => {
            if (moment.replacementActivity) {
                const activityForDate = moment.replacementActivity[format(selectedDate, 'yyyy-MM-dd')];
                if (activityForDate && activityForDate.mood) {
                    totalReplacements++;
                    moodCount[activityForDate.mood] = (moodCount[activityForDate.mood] || 0) + 1;
                }
            }
        });
        
        const data = Object.entries(moodCount).map(([name, value]) => ({ name, value }));
        const total = data.reduce((sum, item) => sum + item.value, 0);

        const processedData = data.length > 0 ? data
            .map(item => ({ ...item, percentage: (item.value / total) * 100 }))
            .sort((a,b) => b.value - a.value) : [];

        let dynamicDescription = t('description_default', { date: format(selectedDate, "MMM d") });
        if (processedData.length > 0) {
            const topMood = processedData[0].name;
            if (topMood === 'proud' || topMood === 'hopeful') {
                dynamicDescription = t('description_positive');
            } else if (topMood === 'calm') {
                dynamicDescription = t('description_calm');
            } else if (topMood === 'uneasy') {
                dynamicDescription = t('description_uneasy');
            }
        } else {
            dynamicDescription = t('description_empty');
        }

        return { moodData: processedData, description: dynamicDescription };

    }, [userProfile.moments, selectedDate, t]);

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
                                    <DialogTitle>About Replacement Moods</DialogTitle>
                                    <DialogDescription>
                                        This chart shows a breakdown of how you felt after choosing a replacement activity instead of smoking.
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <AccordionContent>
                        <div className="p-4 pt-2">
                             {moodData.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <ResponsiveContainer width="100%" height={120}>
                                        <PieChart>
                                            <Pie
                                                data={moodData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={60}
                                                innerRadius={40}
                                                dataKey="value"
                                                stroke="hsl(var(--background))"
                                                strokeWidth={3}
                                            >
                                                {moodData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getMoodColor(entry.name)} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-col gap-2 text-sm">
                                        {moodData.map(entry => (
                                            <div key={entry.name} className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getMoodColor(entry.name) }} />
                                                <span className="font-semibold capitalize">{entry.name}</span>
                                                <span className="ml-auto text-muted-foreground">{entry.percentage.toFixed(0)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-24 items-center justify-center">
                                    <p className="text-muted-foreground text-sm">{t('description_empty')}</p>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
