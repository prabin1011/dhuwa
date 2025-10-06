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

interface Urge {
    timestamp: Timestamp;
    notes?: string;
    type?: string;
    moodBefore?: string;
    moodAfter?: string;
}

interface UserProfile {
    packCost?: number;
    itemsPerPack?: number;
}

interface UrgeHistoryProps {
    urges: WithId<Urge>[];
    isLoading: boolean;
    userProfile: UserProfile;
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

export function UrgeHistory({ urges, isLoading, userProfile }: UrgeHistoryProps) {

    const costPerItem = useMemo(() => {
        const { packCost = 0, itemsPerPack = 1 } = userProfile;
        if (itemsPerPack === 0) return 0;
        return packCost / itemsPerPack;
    }, [userProfile]);

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

    const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

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
                            {sortedGroupKeys.map((dateStr) => {
                                const dailySmokes = groupedUrges[dateStr].length;
                                const dailyCost = dailySmokes * costPerItem;

                                return (
                                <AccordionItem key={dateStr} value={dateStr} className="border bg-secondary/30 rounded-md px-4">
                                     <AccordionTrigger className="py-3 hover:no-underline">
                                        <div className="flex justify-between items-center w-full pr-2">
                                            <h3 className="font-semibold text-sm">
                                                {getGroupTitle(dateStr)}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="font-medium">{dailySmokes} {dailySmokes > 1 ? 'smokes' : 'smoke'}</span>
                                                <span className="font-semibold text-primary">{formatMoney(dailyCost)}</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-2">
                                        <ul className="space-y-1 pt-2 border-t">
                                            {groupedUrges[dateStr].map((urge) => (
                                                <li key={urge.id} className="flex justify-between items-center px-2 py-1 rounded-md text-xs">
                                                    <span className="flex items-center gap-2">
                                                        <span className="font-semibold capitalize">{urge.moodBefore || '...'} &rarr; {urge.moodAfter || '...'}</span>
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
                            )})}
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
