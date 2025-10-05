'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Lightbulb, Sparkles } from 'lucide-react';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow';
import type { DailyInsightInput } from '@/ai/flows/daily-insight-flow';
import type { WithId } from '@/firebase';
import { differenceInHours, formatDistanceToNowStrict, subHours } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface UserProfile {
    goal?: string;
    motivation?: string;
    preferredTone?: string;
}

interface Urge {
    timestamp: Timestamp; // This is what comes from the DB, but it's converted before being passed in
    mood?: string;
}

interface DailyInsightProps {
    userProfile: UserProfile;
    urges: WithId<Urge>[]; // Here timestamp is actually a Date object after sorting
    lastUrgeTime?: Date;
}

export function DailyInsight({ userProfile, urges, lastUrgeTime }: DailyInsightProps) {
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const timeSinceLastUrge = lastUrgeTime ? formatDistanceToNowStrict(lastUrgeTime) : 'a long time';

    useEffect(() => {
        const generateInsight = async () => {
            setIsLoading(true);
            try {
                // Filter urges for the last 48 hours
                const twoDaysAgo = subHours(new Date(), 48);
                const recentUrges = urges
                    .filter(urge => urge.timestamp && (urge.timestamp as unknown as Date) > twoDaysAgo)
                    .map(urge => ({
                        id: urge.id,
                        timestamp: (urge.timestamp as unknown as Date).toISOString(), // Correctly convert Date to ISO string
                        mood: urge.mood
                    }));
                
                const input: DailyInsightInput = {
                    userProfile: {
                        goal: userProfile.goal || 'not set',
                        motivation: userProfile.motivation || 'not set',
                        preferredTone: userProfile.preferredTone || 'friendly',
                    },
                    recentUrges,
                    timeSinceLastUrge,
                };
                
                const result = await getDailyInsight(input);
                setInsight(result);
            } catch (error) {
                console.error("Failed to get daily insight:", error);
                setInsight("Keep focused on your goal. You can do this!"); // Fallback message
            } finally {
                setIsLoading(false);
            }
        };

        generateInsight();
        
    }, [urges, userProfile, timeSinceLastUrge]); // urges is a stable dependency, but its content changes


    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Daily Insight
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-3/4" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-primary/10 border-primary/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    Daily Insight
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-primary-foreground/90">{insight}</p>
            </CardContent>
        </Card>
    );
}
