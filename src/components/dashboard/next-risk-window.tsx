'use client';

import { useMemo, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Replace, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parse, isAfter, isToday, formatDistanceToNowStrict, subDays } from "date-fns";
import type { User } from 'firebase/auth';
import { SmokingPlan } from "./smoking-plan"; // Assuming smoking plan handles its own state now

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

interface Urge {
    timestamp: { toDate: () => Date };
}

interface NextRiskWindowProps {
    user: User;
    userProfile: WithId<UserProfile>;
    urges: WithId<Urge>[];
}

export function NextRiskWindow({ user, userProfile, urges }: NextRiskWindowProps) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 30); // Update every 30 seconds
        return () => clearInterval(timer);
    }, []);

    const { nextMoment, dynamicDescription, timeToNext } = useMemo(() => {
        const moments = userProfile.moments || [];
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        const momentsWithDate = moments.map(m => ({
            ...m,
            date: parse(m.time, 'HH:mm', new Date()),
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        const next = momentsWithDate.find(m => isAfter(m.date, currentTime) && m.completed?.[todayStr] === undefined);
        const timeToNext = next ? formatDistanceToNowStrict(next.date, { addSuffix: true }) : null;

        let description = `Your next planned moment is ${timeToNext}. You have a plan. You can do this.`;
        const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        const missedYesterday = moments.some(m => m.completed?.[yesterdayStr] === undefined && !isAfter(parse(m.time, 'HH:mm', new Date()), new Date()));
        const smokedToday = urges.some(u => u.timestamp && isToday(u.timestamp.toDate()));

        if (!next) {
            description = "No upcoming risk windows today. Well done on completing your plan.";
        } else if (missedYesterday) {
            description = `You missed a moment yesterday. Your next risk is ${timeToNext}. Today is a new chance.`;
        } else if (smokedToday) {
            description = `One moment logged. The chain is only as strong as the next link, which is ${timeToNext}. You can break it here.`;
        }

        return { nextMoment: next, dynamicDescription: description, timeToNext };
    }, [userProfile.moments, urges, currentTime]);
    
    if (!nextMoment || !isToday(new Date())) {
        return null; // Don't show the card if there's no upcoming moment today
    }

    return (
        <Card className="border-primary/40 bg-primary/10">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <CardTitle>Next Risk Window</CardTitle>
                </div>
                <CardDescription className="pt-2">{dynamicDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 mb-4 rounded-md bg-background/50 text-left">
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className='font-mono text-sm'>{nextMoment.time}</span>
                            <span className='text-sm font-medium'>{nextMoment.label}</span>
                        </div>
                     </div>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                    You can replace this moment in the "Today's Plan" card below.
                </p>
            </CardContent>
        </Card>
    );
}
