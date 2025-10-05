'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Lightbulb } from 'lucide-react';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow';
import type { DailyInsightInput } from '@/ai/flows/daily-insight-flow';
import type { WithId } from '@/firebase';
import { differenceInHours, formatDistanceToNowStrict, subHours, format, isSameDay } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { alanCarrQuotes } from '@/lib/quotes';
import { Button } from '../ui/button';

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, string>;
}
interface UserProfile {
    goal?: string;
    motivation?: string;
    preferredTone?: string;
    itemsPerDay?: string;
    moments?: SmokingMoment[];
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
    const [isLoading, setIsLoading] = useState(false);

    // Set a random quote on initial load
    useEffect(() => {
        const randomQuote = alanCarrQuotes[Math.floor(Math.random() * alanCarrQuotes.length)];
        setInsight(randomQuote);
    }, []);

    const timeSinceLastUrge = lastUrgeTime ? formatDistanceToNowStrict(lastUrgeTime) : 'a long time';

    const handleAnalyze = async () => {
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
            
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const todayMoments = userProfile.moments?.map(m => ({
                ...m,
                replacementActivity: m.replacementActivity?.[todayStr] ? { [todayStr]: m.replacementActivity[todayStr] } : undefined,
            })).filter(m => m.replacementActivity);


            const input: DailyInsightInput = {
                userProfile: {
                    goal: userProfile.goal || 'not set',
                    motivation: userProfile.motivation || 'not set',
                    preferredTone: userProfile.preferredTone || 'friendly',
                    itemsPerDay: userProfile.itemsPerDay || 'unknown',
                    moments: todayMoments,
                },
                recentUrges,
                timeSinceLastUrge,
            };
            
            const result = await getDailyInsight(input);
            setInsight(result);
        } catch (error) {
            console.error("Failed to get daily insight:", error);
            setInsight("Couldn't analyze your day. Make sure you've logged some activity first!"); // Fallback message
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Card className="bg-primary/10 border-primary/40">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-primary">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Daily Insight
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/20 hover:text-primary" onClick={handleAnalyze} disabled={isLoading}>
                        Analyze My Day
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full bg-primary/20" />
                        <Skeleton className="h-4 w-3/4 bg-primary/20" />
                    </div>
                ) : (
                     <p className="text-sm text-primary-foreground/90 italic">"{insight}"</p>
                )}
            </CardContent>
        </Card>
    );
}
