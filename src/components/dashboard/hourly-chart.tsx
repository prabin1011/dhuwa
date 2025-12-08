
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { subDays, isAfter } from 'date-fns';
import { Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useTranslations } from 'next-intl';

interface Urge {
    timestamp: Timestamp;
    count?: number;
    type?: string;
}

interface HourlyChartProps {
    urges: WithId<Urge>[];
    habits: string[];
}

const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12; // convert 0 to 12
    return `${h} ${ampm}`;
};

export function HourlyChart({ urges, habits }: HourlyChartProps) {
    const t = useTranslations('dashboard.patternChart');

    const { hourlyData, description } = useMemo(() => {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentUrges = urges.filter(u => u.timestamp && isAfter(u.timestamp.toDate(), thirtyDaysAgo));

        const data: { hour: string, [key: string]: number | string }[] = Array.from({ length: 24 }, (_, i) => ({
            hour: String(i).padStart(2, '0') + ':00',
            ...habits.reduce((acc, habit) => ({ ...acc, [habit]: 0 }), {})
        }));

        recentUrges.forEach(urge => {
            if (urge.timestamp && urge.type && habits.includes(urge.type)) {
                const hour = urge.timestamp.toDate().getHours();
                data[hour][urge.type] = (data[hour][urge.type] as number) + (urge.count || 1);
            }
        });
        
        let dynamicDescription = t('description_default');
        if (recentUrges.length > 10) { // Only calculate peak if there's enough data
            let maxCount = 0;
            let peakStartHour = -1;
            
            const totalCounts = data.map(d => habits.reduce((sum, h) => sum + (d[h] as number), 0));

            // Find the 3-hour window with the most urges
            for (let i = 0; i < 24; i++) {
                let currentWindowCount = 0;
                for (let j = 0; j < 3; j++) {
                    currentWindowCount += totalCounts[(i + j) % 24];
                }
                if (currentWindowCount > maxCount) {
                    maxCount = currentWindowCount;
                    peakStartHour = i;
                }
            }

            if (peakStartHour !== -1 && maxCount > recentUrges.length * 0.2) { // Ensure the peak is significant
                const endHour = (peakStartHour + 2) % 24;
                dynamicDescription = t('description_peak', { start: formatHour(peakStartHour), end: formatHour(endHour) });
            } else {
                dynamicDescription = t('description_spread');
            }
        }


        return { hourlyData: data, description: dynamicDescription };
    }, [urges, habits, t]);

     const habitColors: Record<string, string> = {
        'Cigarettes': 'hsl(var(--primary))',
        'Vape': 'hsl(var(--chart-4))',
        'Weed': 'hsl(var(--chart-6))',
        'Snus': 'hsl(var(--chart-3))'
    };

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
                                    <DialogTitle>About the Daily Pattern</DialogTitle>
                                    <DialogDescription>
                                        This chart shows the total number of urges logged for each hour of the day over the last 30 days, helping you identify your peak craving times.
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <AccordionContent>
                        <div className="p-4 pt-2">
                             <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="hour" 
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value, index) => index % 3 === 0 ? formatHour(index) : ''}
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
                                      labelFormatter={(label) => formatHour(parseInt(label.split(':')[0]))}
                                      labelStyle={{
                                        color: "hsl(var(--foreground))"
                                      }}
                                      formatter={(value: number, name: string) => [`${value} ${name.toLowerCase()}`, name]}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize: "12px", paddingBottom: "10px"}} />
                                    {habits.map(habit => (
                                        <Bar key={habit} dataKey={habit} stackId="a" fill={habitColors[habit]} radius={habits.length === 1 ? [4, 4, 0, 0] : [0,0,0,0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
