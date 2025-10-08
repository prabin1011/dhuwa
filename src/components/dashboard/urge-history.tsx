
"use client";

import { WithId } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useMemo } from "react";
import type { Timestamp } from "firebase/firestore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { UrgeNarrative } from "./urge-narrative";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";


interface Urge {
    timestamp: Timestamp;
    notes?: string;
    type?: string;
    moodBefore?: string;
    moodAfter?: string;
    narrative?: string;
    shortMessage?: string;
    count?: number;
}

interface UserProfile {
    habitDetails?: Record<string, { packCost?: number; itemsPerPack?: number; }>;
    breakDuration?: string;
    currency?: string;
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

const parseBreakDuration = (duration?: string): number => {
    if (!duration) return 5; // Default to 5 minutes
    switch(duration) {
        case 'less-5-min': return 4;
        case '5-10-min': return 8;
        case '10-20-min': return 15;
        case 'more-20-min': return 25;
        default: return 5;
    }
}

const formatTimeSpent = (totalMinutes: number): string => {
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

export function UrgeHistory({ urges, isLoading, userProfile }: UrgeHistoryProps) {

    const timePerSmoke = useMemo(() => parseBreakDuration(userProfile.breakDuration), [userProfile.breakDuration]);

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

    const formatMoney = useMemo(() => {
        const currency = userProfile.currency || 'USD';
        const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });
        return (amount: number) => formatter.format(amount);
    }, [userProfile.currency]);
    
    const getCostPerItem = (habitType?: string) => {
        if (!habitType) return 0;
        const details = userProfile.habitDetails?.[habitType];
        if (!details || !details.packCost || !details.itemsPerPack) return 0;
        return details.packCost / details.itemsPerPack;
    }

    return (
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="p-4 text-left hover:no-underline [&[data-state=open]]:pb-0">
                        <div className="flex justify-between items-start w-full">
                            <div>
                                <CardTitle>Daily Summary</CardTitle>
                                <CardDescription>A look back at your logged activity.</CardDescription>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                            <Info className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs max-w-xs">This is a complete log of all your recorded smokes, grouped by day. Each entry includes an AI-generated micro-journal to help you reflect on the moment.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 pt-2">
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
                                            const dailySmokes = groupedUrges[dateStr].reduce((sum, urge) => sum + (urge.count || 1), 0);
                                            const dailyCost = groupedUrges[dateStr].reduce((sum, urge) => {
                                                const costPer = getCostPerItem(urge.type);
                                                return sum + ((urge.count || 1) * costPer);
                                            }, 0);
                                            const dailyTimeSpent = dailySmokes * timePerSmoke;
    
                                            return (
                                            <AccordionItem key={dateStr} value={dateStr} className="border bg-secondary/30 rounded-md px-4">
                                                 <AccordionTrigger className="py-3 hover:no-underline">
                                                    <div className="flex justify-between items-center w-full pr-2">
                                                        <div className="flex flex-col items-start">
                                                            <h3 className="font-semibold text-sm">
                                                                {getGroupTitle(dateStr)}
                                                            </h3>
                                                            <span className="text-xs text-primary">{formatTimeSpent(dailyTimeSpent)} spent smoking</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="font-medium">{dailySmokes} {dailySmokes > 1 ? 'smokes' : 'smoke'}</span>
                                                            <span className="font-semibold text-primary">{formatMoney(dailyCost)}</span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-2">
                                                    <ul className="space-y-1 pt-2 border-t">
                                                        {groupedUrges[dateStr].map((urge) => (
                                                            <li key={urge.id}>
                                                               <UrgeNarrative urge={urge} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )})}
                                    </Accordion>
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-muted-foreground text-center">Your day is a blank canvas. Dhuwa helps you fill it smoke-free.</p>
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
