"use client";

import { WithId } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MoodSummary } from "./mood-summary";

interface Urge {
    timestamp: Timestamp;
    notes?: string;
    type?: string;
    mood?: string;
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
            if (urge.timestamp) {
                const dateStr = format(urge.timestamp.toDate(), "yyyy-MM-dd");
                if (!acc[dateStr]) {
                    acc[dateStr] = [];
                }
                acc[dateStr].push(urge);
            }
            return acc;
        }, {} as GroupedUrges);
    }, [urges]);

    const sortedGroupKeys = useMemo(() => {
        return Object.keys(groupedUrges).sort((a, b) => b.localeCompare(a));
    }, [groupedUrges]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Summary</CardTitle>
                <CardDescription>A look back at your logged activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full">
                    {isLoading ? (
                        <div className="space-y-4 p-1">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : sortedGroupKeys.length > 0 ? (
                        <Accordion type="multiple" className="space-y-2">
                            {sortedGroupKeys.map((dateStr) => (
                                <AccordionItem key={dateStr} value={dateStr} className="border bg-secondary/30 rounded-md px-4">
                                     <AccordionTrigger className="py-3 hover:no-underline">
                                        <div className="flex flex-col items-start text-left w-full">
                                            <div className="flex justify-between w-full">
                                                <h3 className="font-semibold text-sm">
                                                    {getGroupTitle(dateStr)}
                                                </h3>
                                                <p className="text-sm font-medium pr-2">
                                                    {groupedUrges[dateStr].length} {groupedUrges[dateStr].length > 1 ? 'smokes' : 'smoke'}
                                                </p>
                                            </div>
                                             <MoodSummary urges={groupedUrges[dateStr]} />
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-2">
                                        <ul className="space-y-1 pt-2 border-t">
                                            {groupedUrges[dateStr].map((urge) => (
                                                <li key={urge.id} className="flex justify-between items-center px-2 py-1 rounded-md text-xs">
                                                    <span className="flex items-center gap-2">
                                                        <span className="font-semibold capitalize">{urge.mood}</span>
                                                        <span className="text-muted-foreground">({urge.type || 'cigarette'})</span>
                                                    </span>
                                                    <span className="text-muted-foreground font-mono">
                                                        {format(urge.timestamp.toDate(), "h:mm a")}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground text-center">No smokes logged yet. Keep it up!</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}