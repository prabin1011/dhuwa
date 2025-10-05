'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { format, subDays, isSameDay } from 'date-fns';

interface Urge {
    timestamp: Timestamp;
}

interface DailyHabitChartProps {
    urges: WithId<Urge>[];
}

export function DailyHabitChart({ urges }: DailyHabitChartProps) {
    const dailyData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = subDays(today, i);
            const dayUrges = urges.filter(urge => urge.timestamp && isSameDay(urge.timestamp.toDate(), date));
            data.push({
                date: format(date, 'MMM d'),
                count: dayUrges.length
            });
        }
        return data;
    }, [urges]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>30-Day Trend</CardTitle>
                <CardDescription>Smokes per day over the last 30 days</CardDescription>
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
                        <Tooltip
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
