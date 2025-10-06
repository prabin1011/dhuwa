'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Lightbulb, Timer } from 'lucide-react';
import type { DailyInsightInput } from '@/ai/types/daily-insight-types';
import type { WithId } from '@/firebase';
import { subHours, formatDistanceToNow, differenceInHours } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { alanCarrQuotes } from '@/lib/quotes';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

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
    moodBefore?: string;
}

interface DailyInsightProps {
    userProfile: UserProfile;
    urges: WithId<Urge>[];
    lastUrgeTime?: Date;
}

const COOLDOWN_HOURS = 4;
const LAST_ANALYSIS_KEY = 'lastAnalysisTime';

export function DailyInsight({ userProfile, urges, lastUrgeTime }: DailyInsightProps) {
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [initialQuoteSet, setInitialQuoteSet] = useState(false);
    const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const savedTime = localStorage.getItem(LAST_ANALYSIS_KEY);
        if (savedTime) {
            setLastAnalysis(new Date(parseInt(savedTime, 10)));
        }
    }, []);

    const showRandomQuote = useCallback(() => {
        const randomQuote = alanCarrQuotes[Math.floor(Math.random() * alanCarrQuotes.length)];
        setInsight(randomQuote);
    }, []);

    useEffect(() => {
        if (!initialQuoteSet) {
            showRandomQuote();
            setInitialQuoteSet(true);
        }
    }, [initialQuoteSet, showRandomQuote]);

    const handleAnalyze = async () => {
        if (lastAnalysis && differenceInHours(new Date(), lastAnalysis) < COOLDOWN_HOURS) {
            toast({
                title: 'Insight Cooldown',
                description: `You can analyze your progress again in about ${COOLDOWN_HOURS - differenceInHours(new Date(), lastAnalysis)} hour(s).`,
            });
            return;
        }

        setIsLoading(true);
        try {
            const twoDaysAgo = subHours(new Date(), 48);
            const recentUrges = urges
                .filter(urge => urge.timestamp && urge.timestamp.toDate() > twoDaysAgo)
                .map(urge => ({
                    id: urge.id,
                    timestamp: urge.timestamp.toDate().toISOString(),
                    mood: urge.moodBefore
                }));

            const timeSinceLastUrge = lastUrgeTime 
                ? formatDistanceToNow(lastUrgeTime, { addSuffix: true }) 
                : 'a long time';
            
            const input: DailyInsightInput = {
                userProfile: {
                    goal: userProfile.goal,
                    motivation: userProfile.motivation,
                    preferredTone: userProfile.preferredTone,
                    itemsPerDay: userProfile.itemsPerDay,
                    moments: userProfile.moments,
                },
                recentUrges,
                timeSinceLastUrge,
            };

            const res = await fetch('/api/daily-insight', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to get insight.');
            
            setInsight(data.insight);
            const now = new Date();
            setLastAnalysis(now);
            localStorage.setItem(LAST_ANALYSIS_KEY, String(now.getTime()));

        } catch (error) {
            console.error("Failed to get daily insight:", error);
            setInsight("Couldn't analyze yet. Please ensure your API key is set up correctly and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const isCoolingDown = lastAnalysis && differenceInHours(new Date(), lastAnalysis) < COOLDOWN_HOURS;

    return (
        <Card className="bg-primary/10 border-primary/40">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    {isLoading ? (
                        <div className="flex flex-col gap-2 w-full">
                            <Skeleton className="h-4 w-full bg-primary/20" />
                            <Skeleton className="h-4 w-3/4 bg-primary/20" />
                        </div>
                    ) : (
                         <p className="text-sm text-primary italic flex-1">"{insight}"</p>
                    )}
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-primary hover:bg-primary/20 hover:text-primary -mr-2 -mt-2 h-8 w-8" 
                        onClick={handleAnalyze} 
                        disabled={isLoading || isCoolingDown}
                    >
                         {isCoolingDown ? <Timer className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}