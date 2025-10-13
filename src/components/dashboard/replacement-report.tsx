
'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { format, parseISO, isToday, isYesterday, isSameDay } from "date-fns";
import { Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, string>;
}

interface UserProfile {
    moments?: SmokingMoment[];
}

interface ReplacementReportProps {
    userProfile: UserProfile;
    selectedDate: Date;
}

interface ReplacementLog {
    date: string;
    time: string;
    momentLabel: string;
    activity: string;
}

const getGroupTitle = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "eeee, MMMM d");
};

const encouragementMessages = [
    "Yes. This is how you reclaim your time. The first step is the hardest and you've taken it.",
    "Each replacement is a vote for a new you. You're casting multiple votes today. Keep going.",
    "This is it. You're not just 'not smoking,' you're actively living. This is what winning looks like.",
    "Keep this up for 3 days to build confidence. Keep it up for 21 days to build a new habit. You are on your way.",
    "Excellent choice. Freedom is built one decision at a time.",
    "This is the path. Every time you choose a replacement, you weaken the addiction's hold on you."
];

const emptyStateMessages = [
    "Your best weapon against an urge is a plan. What's one positive action you'll choose next time?",
    "An opportunity awaits. The next urge isn't a threat; it's a chance to make a better choice.",
    "No replacements logged yet. Let's change that. What will you do instead of smoking next time?"
]

export function ReplacementReport({ userProfile, selectedDate }: ReplacementReportProps) {
    const replacementLogs = useMemo(() => {
        const logs: ReplacementLog[] = [];
        const moments = userProfile.moments || [];
        
        moments.forEach(moment => {
            if (moment.replacementActivity) {
                Object.entries(moment.replacementActivity).forEach(([dateStr, activity]) => {
                    logs.push({
                        date: dateStr,
                        time: moment.time,
                        momentLabel: moment.label,
                        activity: activity
                    });
                });
            }
        });
        
        // Sort logs by date descending
        return logs.sort((a, b) => b.date.localeCompare(a.date));
    }, [userProfile.moments]);

    const groupedLogs = useMemo(() => {
        return replacementLogs.reduce((acc, log) => {
            if (!acc[log.date]) {
                acc[log.date] = [];
            }
            acc[log.date].push(log);
            return acc;
        }, {} as Record<string, ReplacementLog[]>);
    }, [replacementLogs]);

    const sortedGroupKeys = Object.keys(groupedLogs);
    
    const logsForSelectedDate = groupedLogs[format(selectedDate, 'yyyy-MM-dd')] || [];

    const description = logsForSelectedDate.length > 0 
        ? encouragementMessages[logsForSelectedDate.length % encouragementMessages.length]
        : emptyStateMessages[Math.floor(Math.random() * emptyStateMessages.length)];

    return (
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="p-4 text-left hover:no-underline [&[data-state=open]]:pb-0">
                        <div className="flex justify-between items-start w-full gap-2">
                            <div className="flex-1">
                                <CardTitle>Replacement Report</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </div>
                             <Dialog>
                                <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xs">
                                    <DialogHeader>
                                        <DialogTitle>About the Replacement Report</DialogTitle>
                                        <DialogDescription>
                                            This card shows a log of the positive activities you chose instead of smoking for your planned moments.
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 pt-2">
                             <ScrollArea className="h-48 w-full">
                                 {logsForSelectedDate.length > 0 ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground px-1 mb-2">
                                                {getGroupTitle(format(selectedDate, 'yyyy-MM-dd'))}
                                            </h3>
                                            <ul className="space-y-2">
                                                {logsForSelectedDate.map((log, index) => (
                                                    <li key={`${log.date}-${log.time}-${index}`} className="text-sm px-1">
                                                        <span className="font-mono text-xs text-muted-foreground">{log.time}</span> &rarr; <span className="font-semibold">{log.activity}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : sortedGroupKeys.length > 0 && !logsForSelectedDate.length ? (
                                     <div className="flex h-full items-center justify-center">
                                        <p className="text-muted-foreground text-sm text-center">No replacements logged for this day. <br/> Other logs available.</p>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-muted-foreground text-sm">Skip a smoke to log a replacement!</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
