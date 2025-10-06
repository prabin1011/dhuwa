
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';

interface Urge {
    timestamp: Timestamp;
    count?: number;
}

interface HourlyChartProps {
    urges: WithId<Urge>[];
}

export function HourlyChart({ urges }: HourlyChartProps) {
    const hourlyData = useMemo(() => {
        const data: { hour: string, count: number }[] = Array.from({ length: 24 }, (_, i) => ({
            hour: String(i).padStart(2, '0') + ':00',
            count: 0
        }));

        urges.forEach(urge => {
            if (urge.timestamp) {
                const hour = urge.timestamp.toDate().getHours();
                data[hour].count += urge.count || 1;
            }
        });
        return data;
    }, [urges]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Pattern</CardTitle>
                <CardDescription>Smokes per hour over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                            dataKey="hour" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value, index) => index % 3 === 0 ? value : ''}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10} 
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
