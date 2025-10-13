'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { format, subDays, isSameDay } from 'date-fns';
import { Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface Urge {
    timestamp: Timestamp;
    count?: number;
    type?: string;
}

interface DailyHabitChartProps {
    urges: WithId<Urge>[];
    selectedDate: Date | undefined;
    habits: string[];
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

export function DailyHabitChart({ urges, selectedDate, habits }: DailyHabitChartProps) {
    const { dailyData, description } = useMemo(() => {
        const data = [];
        const today = new Date();
        const safeUrges = urges.filter(urge => urge.timestamp?.toDate); // Ensure timestamp is valid

        for (let i = 29; i >= 0; i--) {
            const date = subDays(today, i);
            const dayUrges = safeUrges.filter(urge => isSameDay(urge.timestamp.toDate(), date));
            
            const counts = habits.reduce((acc, habit) => {
                acc[habit] = dayUrges
                    .filter(u => u.type === habit)
                    .reduce((sum, u) => sum + (u.count || 1), 0);
                return acc;
            }, {} as Record<string, number>);

            data.push({
                date: format(date, 'MMM d'),
                ...counts
            });
        }
        
        const totalSmokes = data.reduce((sum, day) => {
            return sum + habits.reduce((daySum, habit) => daySum + (day[habit] || 0), 0);
        }, 0);
        
        const avgSmokes = totalSmokes > 0 ? totalSmokes / 30 : 0;
        const selectedDayData = data.find(d => d.date === format(selectedDate || new Date(), 'MMM d'));
        const selectedDayCount = selectedDayData ? habits.reduce((sum, habit) => sum + (selectedDayData[habit] || 0), 0) : 0;

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
    }, [urges, selectedDate, habits]);

    const habitColors: Record<string, string> = {
        'Cigarettes': 'hsl(var(--primary))',
        'Weed': 'hsl(var(--chart-6))',
    };

    return (
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <div className="p-4 hover:no-underline [&[data-state=open]]:pb-0">
                        <div className="flex justify-between items-start w-full gap-2">
                            <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline">
                                <div>
                                    <CardTitle>30-Day Trend</CardTitle>
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
                                        <DialogTitle>About the 30-Day Trend</DialogTitle>
                                        <DialogDescription>
                                            This chart visualizes your daily habit count over the last 30 days to help you see your progress and identify long-term patterns.
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <AccordionContent>
                        <div className="p-4 pt-2">
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
