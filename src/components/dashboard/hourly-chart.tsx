
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { subDays, isAfter } from 'date-fns';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';

interface Urge {
    timestamp: Timestamp;
    count?: number;
    type?: string;
}

interface HourlyChartProps {
    urges: WithId<Urge>[];
}

const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12; // convert 0 to 12
    return `${h} ${ampm}`;
};

export function HourlyChart({ urges }: HourlyChartProps) {
    const { hourlyData, description } = useMemo(() => {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentUrges = urges.filter(u => u.timestamp && isAfter(u.timestamp.toDate(), thirtyDaysAgo));

        const data: { hour: string, count: number }[] = Array.from({ length: 24 }, (_, i) => ({
            hour: String(i).padStart(2, '0') + ':00',
            count: 0
        }));

        recentUrges.forEach(urge => {
            if (urge.timestamp) {
                const hour = urge.timestamp.toDate().getHours();
                data[hour].count += urge.count || 1;
            }
        });
        
        let dynamicDescription = "Your smoking pattern by hour, based on the last 30 days.";
        if (recentUrges.length > 10) { // Only calculate peak if there's enough data
            let maxCount = 0;
            let peakStartHour = -1;

            // Find the 3-hour window with the most smokes
            for (let i = 0; i < 24; i++) {
                let currentWindowCount = 0;
                for (let j = 0; j < 3; j++) {
                    currentWindowCount += data[(i + j) % 24].count;
                }
                if (currentWindowCount > maxCount) {
                    maxCount = currentWindowCount;
                    peakStartHour = i;
                }
            }

            if (peakStartHour !== -1 && maxCount > recentUrges.length * 0.2) { // Ensure the peak is significant
                const endHour = (peakStartHour + 2) % 24;
                dynamicDescription = `Your peak smoking time is between ${formatHour(peakStartHour)} and ${formatHour(endHour)}. Awareness is the first step to changing it.`;
            } else {
                dynamicDescription = "No clear peak in your smoking times. Your habit seems evenly spread throughout the day.";
            }
        }


        return { hourlyData: data, description: dynamicDescription };
    }, [urges]);

    return (
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="p-4 text-left hover:no-underline [&[data-state=open]]:pb-0">
                        <div className="flex justify-between items-start w-full">
                            <div>
                                <CardTitle>Daily Pattern</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                            <Info className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs max-w-xs">This chart shows the total number of smokes logged for each hour of the day over the last 30 days, helping you identify your peak craving times.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </AccordionTrigger>
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
                                      itemStyle={{
                                        color: "hsl(var(--primary))"
                                      }}
                                       formatter={(value: number) => [`${value} smokes`, 'Count']}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
