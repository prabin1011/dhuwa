'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useTranslations } from "next-intl";

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, { activity: string; mood?: string; }>;
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

const getGroupTitle = (dateStr: string, t: (key: string) => string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return t('today');
    if (isYesterday(date)) return t('yesterday');
    return format(date, "eeee, MMMM d");
};

export function ReplacementReport({ userProfile, selectedDate }: ReplacementReportProps) {
    const t = useTranslations('dashboard.replacementReport');
    
    const replacementLogs = useMemo(() => {
        const logs: ReplacementLog[] = [];
        const moments = userProfile.moments || [];
        
        moments.forEach(moment => {
            if (moment.replacementActivity) {
                Object.entries(moment.replacementActivity).forEach(([dateStr, replacement]) => {
                    logs.push({
                        date: dateStr,
                        time: moment.time,
                        momentLabel: moment.label,
                        activity: replacement.activity,
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

    const description = useMemo(() => {
        if (logsForSelectedDate.length > 0) {
            const index = logsForSelectedDate.length % 6;
            return t(`description_encouragement_${index + 1}` as any);
        } else {
            const index = Math.floor(Math.random() * 3);
            return t(`description_empty_${index + 1}` as any);
        }
    },[logsForSelectedDate.length, t]);

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
                                    <DialogTitle>About the Replacement Report</DialogTitle>
                                    <DialogDescription>
                                        This card shows a log of the positive activities you chose instead of smoking for your planned moments.
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <AccordionContent>
                        <div className="p-4 pt-2">
                             <ScrollArea className="h-48 w-full">
                                 {logsForSelectedDate.length > 0 ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground px-1 mb-2">
                                                {getGroupTitle(format(selectedDate, 'yyyy-MM-dd'), t)}
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
                                        <p className="text-muted-foreground text-sm text-center">{t('no_replacements_day')}</p>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-muted-foreground text-sm">{t('no_replacements_yet')}</p>
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
