"use client";

import { WithId } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useMemo } from "react";
import type { Timestamp } from "firebase/firestore";

interface Urge {
    timestamp: Timestamp;
    notes?: string;
}

interface UrgeHistoryProps {
    urges: WithId<Urge>[];
    isLoading: boolean;
}

interface GroupedUrges {
    [key: string]: WithId<Urge>[];
}

const getGroupTitle = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "eeee, MMMM d");
};

export function UrgeHistory({ urges, isLoading }: UrgeHistoryProps) {

    const groupedUrges = useMemo(() => {
        return urges.reduce((acc, urge) => {
            const dateStr = format(urge.timestamp.toDate(), "yyyy-MM-dd");
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(urge);
            return acc;
        }, {} as GroupedUrges);
    }, [urges]);

    const sortedGroupKeys = useMemo(() => {
        return Object.keys(groupedUrges).sort((a, b) => b.localeCompare(a));
    }, [groupedUrges]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Smoking History</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full">
                    {isLoading ? (
                        <div className="space-y-4 p-1">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : sortedGroupKeys.length > 0 ? (
                        <div className="space-y-4">
                            {sortedGroupKeys.map((dateStr, index) => (
                                <div key={dateStr}>
                                    <h3 className="text-sm font-medium text-muted-foreground px-4 mb-2">
                                        {getGroupTitle(dateStr)}
                                    </h3>
                                    <ul className="space-y-1">
                                        {groupedUrges[dateStr].map((urge) => (
                                            <li key={urge.id} className="flex justify-between items-center px-4 py-2 rounded-md hover:bg-muted/50">
                                                <span className="text-sm">
                                                    Logged a cigarette
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(urge.timestamp.toDate(), "h:mm a")}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {index < sortedGroupKeys.length - 1 && <Separator className="my-2" />}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground">No cigarettes logged yet. Keep it up!</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
