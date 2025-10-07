'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';

interface Urge {
    timestamp: Timestamp;
    moodBefore?: string;
    moodAfter?: string;
}

interface MoodReportProps {
    urges: WithId<Urge>[];
    selectedDate: Date;
}

const COLORS: Record<string, string> = {
    // Before
    stressed: 'hsl(var(--chart-1))',
    anxious: 'hsl(var(--chart-2))',
    bored: 'hsl(var(--chart-3))',
    lonely: 'hsl(var(--chart-4))',
    happy: 'hsl(var(--chart-5))',
    tired: 'hsl(var(--primary))',
    neutral: 'hsl(var(--secondary))',
    // After
    calm: 'hsl(var(--chart-2))',
    guilty: 'hsl(var(--chart-1))',
    same: 'hsl(var(--muted))',
    energized: 'hsl(var(--chart-4))',
    sleepy: 'hsl(var(--chart-5))',
    // Default
    default: 'hsl(var(--muted))'
};

const getMoodColor = (mood: string) => COLORS[mood] || COLORS.default;

const MoodPieChart = ({ data, title }: { data: { name: string, value: number, percentage: number }[], title: string }) => (
    <div>
        <h4 className="text-sm font-medium text-center mb-2">{title}</h4>
        {data.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 items-center">
                <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={50}
                            innerRadius={30}
                            dataKey="value"
                            stroke="hsl(var(--background))"
                            strokeWidth={3}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getMoodColor(entry.name)} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 text-xs">
                    {data.map(entry => (
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
                <p className="text-muted-foreground text-xs">No data for this day.</p>
            </div>
        )}
    </div>
);


export function MoodReport({ urges, selectedDate }: MoodReportProps) {
    const { beforeData, afterData, description } = useMemo(() => {
        const moodsBeforeCount: Record<string, number> = {};
        const moodsAfterCount: Record<string, number> = {};

        const todaysUrges = urges.filter(urge => urge.timestamp && isSameDay(urge.timestamp.toDate(), selectedDate));
        
        todaysUrges.forEach(urge => {
            if (urge.moodBefore) {
                moodsBeforeCount[urge.moodBefore] = (moodsBeforeCount[urge.moodBefore] || 0) + 1;
            }
            if (urge.moodAfter) {
                moodsAfterCount[urge.moodAfter] = (moodsAfterCount[urge.moodAfter] || 0) + 1;
            }
        });
        
        const processData = (countData: Record<string, number>) => {
            const data = Object.entries(countData).map(([name, value]) => ({ name, value }));
            if (data.length === 0) return [];
            const total = data.reduce((sum, item) => sum + item.value, 0);
            return data
                .map(item => ({ ...item, percentage: (item.value / total) * 100 }))
                .sort((a,b) => b.value - a.value);
        };

        const bData = processData(moodsBeforeCount);
        const aData = processData(moodsAfterCount);

        let dynamicDescription = `Your feelings before & after smoking on ${format(selectedDate, "MMM d")}.`;
        if (bData.length > 0) {
            const topMood = bData[0].name;
            if (topMood === 'stressed' || topMood === 'anxious') {
                dynamicDescription = "Stress was the trigger. But nicotine is a loan shark for calm—it gives a moment, then takes back more.";
            } else if (topMood === 'bored') {
                dynamicDescription = "Boredom is the playground of bad habits. Did the smoke truly entertain you, or just kill ten minutes?";
            } else if (topMood === 'happy') {
                dynamicDescription = "You reached for a cigarette when you were already happy. Why invite a thief to a party?";
            } else if (topMood === 'tired') {
                dynamicDescription = "You smoked for a lift when your body craved rest. A false friend, offering a jolt before dragging you down further."
            } else if (topMood === 'lonely') {
                dynamicDescription = "You smoked for company. But the cigarette is a friend that takes your money, your health, and then leaves you alone."
            }
        }
        if (aData.length > 0) {
            const topAfterMood = aData[0].name;
             if (topAfterMood === 'guilty' && (aData[0].percentage > 50)) {
                dynamicDescription = `This guilt is a heavy, self-inflicted tax. The cigarette promised relief and left you with regret. It lied.`;
            } else if (topAfterMood === 'same') {
                dynamicDescription = `You felt the same after. The habit offered no change, no relief. It was for nothing. Remember this emptiness.`
            }
        }
        if (bData.length === 0 && aData.length === 0) {
            dynamicDescription = "No moods logged today. A blank slate for tomorrow."
        }


        return { beforeData: bData, afterData: aData, description: dynamicDescription };

    }, [urges, selectedDate]);

    const hasData = beforeData.length > 0 || afterData.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mood Analysis</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <div className="grid grid-cols-1 divide-y divide-border">
                        <div className="pb-4">
                           <MoodPieChart data={beforeData} title="Before Smoking" />
                        </div>
                        <div className="pt-4">
                            <MoodPieChart data={afterData} title="After Smoking" />
                        </div>
                    </div>
                ) : (
                     <div className="flex h-24 items-center justify-center">
                        <p className="text-muted-foreground text-sm">No moods logged for this day.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
