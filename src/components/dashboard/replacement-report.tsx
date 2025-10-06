'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { format, parseISO, isToday, isYesterday, isSameDay } from "date-fns";

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
    "Yes. This is how you reclaim your time. Keep building.",
    "Each replacement is a vote for a new you. Keep voting.",
    "This is it. You're not just 'not smoking,' you're living.",
    "Excellent choice. Freedom is built one decision at a time.",
    "Keep this up for 3 days. Then 7. Then 21. This is how habits die."
];

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
        : "Activities you choose instead of giving in.";

    return (
        <Card>
            <CardHeader>
                <CardTitle>Replacement Report</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    );
}
