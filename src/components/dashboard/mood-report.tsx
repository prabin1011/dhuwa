'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';

interface Urge {
    timestamp: Timestamp;
    mood?: string;
}

interface MoodReportProps {
    urges: WithId<Urge>[];
    selectedDate: Date;
}

const COLORS: Record<string, string> = {
    stressed: 'hsl(var(--chart-1))',
    anxious: 'hsl(var(--chart-2))',
    bored: 'hsl(var(--chart-3))',
    lonely: 'hsl(var(--chart-4))',
    happy: 'hsl(var(--chart-5))',
    tired: 'hsl(var(--primary))',
    neutral: 'hsl(var(--secondary))',
    default: 'hsl(var(--muted))'
};

const getMoodColor = (mood: string) => COLORS[mood] || COLORS.default;

export function MoodReport({ urges, selectedDate }: MoodReportProps) {
    const moodData = useMemo(() => {
        const moodsCount: Record<string, number> = {};

        urges
            .filter(urge => urge.timestamp && isSameDay(urge.timestamp.toDate(), selectedDate))
            .forEach(urge => {
                if (urge.mood) {
                    moodsCount[urge.mood] = (moodsCount[urge.mood] || 0) + 1;
                }
            });
        
        const data = Object.entries(moodsCount).map(([name, value]) => ({ name, value }));

        if (data.length === 0) {
            return [];
        }

        const total = data.reduce((sum, item) => sum + item.value, 0);

        return data
            .map(item => ({ ...item, percentage: (item.value / total) * 100 }))
            .sort((a,b) => b.value - a.value);

    }, [urges, selectedDate]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mood Report</CardTitle>
                <CardDescription>Your feelings when you logged a smoke on {format(selectedDate, "MMM d")}.</CardDescription>
            </CardHeader>
            <CardContent>
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
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getMoodColor(entry.name) }} />
                                    <span className="font-semibold capitalize">{entry.name}</span>
                                    <span className="ml-auto text-muted-foreground">{entry.percentage.toFixed(0)}%</span>
                                </div>
                            ))}
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
