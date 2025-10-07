
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { format, subDays, isSameDay } from 'date-fns';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface Urge {
    timestamp: Timestamp;
    count?: number;
}

interface DailyHabitChartProps {
    urges: WithId<Urge>[];
    selectedDate: Date | undefined;
}

const descriptions = {
    higher: [
        "A tough day, well above your average. It happens. Reflect on what was different today. Don't let one day define the journey.",
        "A bit more than usual. A small deviation, not a disaster. What were the triggers? Let's be ready for them tomorrow."
    ],
    lower: [
        "A good day, well below your average. This is progress. This is strength. Build on this momentum.",
        "Look at this. A day of control, discipline, and success. This is proof you can do it."
    ],
    zero: [
        "Zero. This is a massive win against a daily average of {avg}. This is proof you can do it.",
        "Zero smokes logged today. An amazing achievement! Keep this momentum going."
    ],
    default: "Your 30-day average is {avg} smokes/day."
}

export function DailyHabitChart({ urges, selectedDate }: DailyHabitChartProps) {
    const { dailyData, description } = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = subDays(today, i);
            const dayUrges = urges.filter(urge => urge.timestamp && isSameDay(urge.timestamp.toDate(), date));
            const count = dayUrges.reduce((sum, urge) => sum + (urge.count || 1), 0);
            data.push({
                date: format(date, 'MMM d'),
                count
            });
        }
        
        const totalSmokes = data.reduce((sum, day) => sum + day.count, 0);
        const avgSmokes = totalSmokes > 0 ? totalSmokes / 30 : 0;
        const selectedDayCount = data.find(d => d.date === format(selectedDate || new Date(), 'MMM d'))?.count ?? 0;

        let dynamicDescription = descriptions.default.replace('{avg}', avgSmokes.toFixed(1));
        if (selectedDate) {
            if (selectedDayCount > avgSmokes * 1.5 && avgSmokes > 0) {
                dynamicDescription = descriptions.higher[0];
            } else if (selectedDayCount > avgSmokes * 1.1 && avgSmokes > 0) {
                dynamicDescription = descriptions.higher[1];
            } else if (selectedDayCount === 0 && avgSmokes > 0) {
                 dynamicDescription = descriptions.zero[0].replace('{avg}', avgSmokes.toFixed(1));
            } else if (selectedDayCount < avgSmokes * 0.8 && selectedDayCount > 0) {
                dynamicDescription = descriptions.lower[0];
            } else if (selectedDayCount === 0) {
                dynamicDescription = descriptions.zero[1];
            }
        }
        
        return { dailyData: data, description: dynamicDescription };
    }, [urges, selectedDate]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>30-Day Trend</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs max-w-xs">This chart visualizes your daily smoke count over the last 30 days to help you see your progress and identify long-term patterns.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value, index) => index % 5 === 0 ? value : ''}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            width={30}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px"
                          }}
                          labelStyle={{
                            color: "hsl(var(--foreground))"
                          }}
                          itemStyle={{
                            color: "hsl(var(--primary))"
                          }}
                           formatter={(value: number) => [`${value} smokes`, 'Count']}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
