'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { format, parseISO, isToday, isYesterday } from "date-fns";

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

export function ReplacementReport({ userProfile }: ReplacementReportProps) {
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Replacement Report</CardTitle>
                <CardDescription>Activities you chose instead of smoking.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48 w-full">
                     {sortedGroupKeys.length > 0 ? (
                        <div className="space-y-4">
                            {sortedGroupKeys.map((dateStr) => (
                                <div key={dateStr}>
                                    <h3 className="text-sm font-medium text-muted-foreground px-1 mb-2">
                                        {getGroupTitle(dateStr)}
                                    </h3>
                                    <ul className="space-y-2">
                                        {groupedLogs[dateStr].map((log, index) => (
                                            <li key={`${log.date}-${log.time}-${index}`} className="text-sm px-1">
                                                <span className="font-mono text-xs text-muted-foreground">{log.time}</span> &rarr; <span className="font-semibold">{log.activity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
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
