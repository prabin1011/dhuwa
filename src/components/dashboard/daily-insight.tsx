'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Lightbulb, Timer } from 'lucide-react';
import type { WithId } from '@/firebase';
import { differenceInHours } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSummaryStats, type SummaryStats } from '@/lib/get-summary-stats';
import { insightTemplates } from '@/lib/insight-templates';
import { renderTemplate } from '@/lib/render-template';

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, { activity: string; mood?: string; }>;
}
interface UserProfile {
    goal?: string;
    motivation?: string;
    preferredTone?: string;
    itemsPerDay?: string;
    moments?: SmokingMoment[];
    habitDetails?: Record<string, { packCost?: number; itemsPerPack?: number; itemsPerDay?: string | number }>;
    currency?: string;
    breakDuration?: string;
}

interface Urge {
    timestamp: Timestamp;
    moodBefore?: string;
    count?: number;
    type?: string;
}

interface DailyInsightProps {
    userProfile: UserProfile;
    urges: WithId<Urge>[];
    lastUrgeTime?: Date;
}

const COOLDOWN_HOURS = 4;
const LAST_ANALYSIS_KEY = 'lastAnalysisTime';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chooseTemplate(stats: SummaryStats) {
  if (stats.todaySmokes > (stats.previousAverage ?? 0)) {
    return pick(insightTemplates.recovery);
  }
  if (Number(stats.reductionPercent) > 0 || stats.todaySmokes < (stats.previousAverage ?? 0)) {
    return pick(insightTemplates.progress);
  }
  if ((stats.urgeCount ?? 0) <= 1 && stats.timeBetweenUrges !== 'your first one') {
    return pick(insightTemplates.identity);
  }
  return pick([
    ...insightTemplates.mindfulness,
    ...insightTemplates.trigger,
  ]);
}

export function DailyInsight({ userProfile, urges }: DailyInsightProps) {
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

    const showNewInsight = useCallback(() => {
        const stats = getSummaryStats(urges, userProfile);
        const template = chooseTemplate(stats);
        setInsight(renderTemplate(template, stats));
    }, [urges, userProfile]);

    useEffect(() => {
        if (!initialQuoteSet) {
            const stats = getSummaryStats(urges, userProfile);
            const randomTemplate = pick([
                ...insightTemplates.identity,
                ...insightTemplates.mindfulness,
            ]);
            setInsight(renderTemplate(randomTemplate, stats));
            setInitialQuoteSet(true);
        }
    }, [initialQuoteSet, showNewInsight, urges, userProfile]);

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
            showNewInsight();
            const now = new Date();
            setLastAnalysis(now);
            localStorage.setItem(LAST_ANALYSIS_KEY, String(now.getTime()));
            toast({ title: 'New Insight Revealed', description: 'Your progress has been analyzed.' });

        } catch (error) {
            console.error("Failed to get daily insight:", error);
            setInsight("Couldn't analyze your progress right now. Please try again later.");
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
                        disabled={isLoading || !!isCoolingDown}
                    >
                         {isCoolingDown ? <Timer className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
