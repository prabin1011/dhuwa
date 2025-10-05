'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Lightbulb } from 'lucide-react';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow';
import type { DailyInsightInput } from '@/ai/flows/daily-insight-flow';
import type { WithId } from '@/firebase';
import { subHours, format } from 'date-fns';
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
    timestamp: Timestamp;
    mood?: string;
}

interface DailyInsightProps {
    userProfile: UserProfile;
    urges: WithId<Urge>[];
    lastUrgeTime?: Date;
}

export function DailyInsight({ userProfile, urges }: DailyInsightProps) {
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Set a random quote on initial load
    useEffect(() => {
        const randomQuote = alanCarrQuotes[Math.floor(Math.random() * alanCarrQuotes.length)];
        setInsight(randomQuote);
    }, []);

    const timeSinceLastUrge = userProfile.moments?.length ? 
        (lastUrgeTime ? format(lastUrgeTime, 'PPpp') : 'a long time') 
        : 'a long time';

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const twoDaysAgo = subHours(new Date(), 48);
            const recentUrges = urges
                .filter(urge => urge.timestamp && (urge.timestamp as unknown as Date) > twoDaysAgo)
                .map(urge => ({
                    id: urge.id,
                    timestamp: (urge.timestamp as unknown as Date).toISOString(),
                    mood: urge.mood
                }));
            
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const todayMoments = userProfile.moments?.map(m => {
                const replacement = m.replacementActivity?.[todayStr];
                return {
                    ...m,
                    replacementActivity: replacement ? { [todayStr]: replacement } : undefined,
                };
            }) || [];


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
            setInsight("Couldn't analyze your day. Make sure you've logged some activity first!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-primary/10 border-primary/40">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                     <div className="flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-primary mt-1" />
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col gap-2 w-full">
                            <Skeleton className="h-4 w-full bg-primary/20" />
                            <Skeleton className="h-4 w-3/4 bg-primary/20" />
                        </div>
                    ) : (
                         <p className="text-sm text-primary-foreground/90 italic flex-1">"{insight}"</p>
                    )}
                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/20 hover:text-primary -mr-2 -mt-1" onClick={handleAnalyze} disabled={isLoading}>
                        Analyze
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
