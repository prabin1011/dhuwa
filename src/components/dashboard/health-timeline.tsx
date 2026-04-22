
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { HeartPulse } from 'lucide-react';

interface HealthMilestone {
  id: string;
  hoursRequired: number;
  icon: string;
  title: string;
  fact: string;
}

const HEALTH_MILESTONES: HealthMilestone[] = [
  {
    id: '20min',
    hoursRequired: 0.33,
    icon: '❤️',
    title: 'Blood pressure normalizes',
    fact: 'Your heart rate drops to a healthier level within 20 minutes of your last smoke.',
  },
  {
    id: '8h',
    hoursRequired: 8,
    icon: '🫁',
    title: 'Carbon monoxide drops',
    fact: 'Oxygen levels in your blood return to normal. Your lungs can breathe easier.',
  },
  {
    id: '24h',
    hoursRequired: 24,
    icon: '🧠',
    title: 'Dopamine receptors healing',
    fact: 'Your brain begins re-sensitizing to natural pleasures. Anxiety starts to ease.',
  },
  {
    id: '48h',
    hoursRequired: 48,
    icon: '👃',
    title: 'Taste & smell returning',
    fact: 'Nerve endings damaged by smoking start to regenerate. Food tastes better.',
  },
  {
    id: '72h',
    hoursRequired: 72,
    icon: '🌿',
    title: 'Airways relaxing',
    fact: 'Bronchial tubes begin to relax, making breathing noticeably easier.',
  },
  {
    id: '2w',
    hoursRequired: 24 * 14,
    icon: '🏃',
    title: 'Circulation improving',
    fact: 'Walking gets easier. Your heart no longer has to work as hard.',
  },
  {
    id: '1m',
    hoursRequired: 24 * 30,
    icon: '💨',
    title: 'Lung function up 30%',
    fact: 'Cilia in your lungs start clearing out mucus. Less coughing, more energy.',
  },
  {
    id: '3m',
    hoursRequired: 24 * 90,
    icon: '🌬️',
    title: 'Chronic cough fading',
    fact: 'Lung function continues to improve. You may notice you can exercise longer.',
  },
  {
    id: '1y',
    hoursRequired: 24 * 365,
    icon: '💓',
    title: 'Heart disease risk halved',
    fact: 'Your risk of coronary heart disease is now half that of a smoker.',
  },
  {
    id: '5y',
    hoursRequired: 24 * 365 * 5,
    icon: '🧬',
    title: 'Stroke risk = non-smoker',
    fact: 'Your stroke risk is now the same as someone who has never smoked.',
  },
  {
    id: '10y',
    hoursRequired: 24 * 365 * 10,
    icon: '🏆',
    title: 'Lung cancer risk halved',
    fact: 'Your lung cancer risk is now half that of someone who kept smoking.',
  },
  {
    id: '15y',
    hoursRequired: 24 * 365 * 15,
    icon: '👑',
    title: 'Heart risk = never-smoker',
    fact: 'Your heart disease risk is now the same as someone who never smoked. You did it.',
  },
];

function formatHoursToLabel(hours: number): string {
  if (hours < 1)   return `${Math.round(hours * 60)} min`;
  if (hours < 24)  return `${hours}h`;
  const days = hours / 24;
  if (days < 14)   return `${Math.round(days)}d`;
  if (days < 60)   return `${Math.round(days / 7)}w`;
  if (days < 365)  return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}yr`;
}

interface HealthTimelineProps {
  smokeFreeHours: number;
}

export function HealthTimeline({ smokeFreeHours }: HealthTimelineProps) {
  const { reached, upcoming, nextMilestone, progressToNext } = useMemo(() => {
    const reached = HEALTH_MILESTONES.filter(m => smokeFreeHours >= m.hoursRequired);
    const upcoming = HEALTH_MILESTONES.filter(m => smokeFreeHours < m.hoursRequired);
    const nextMilestone = upcoming[0] ?? null;
    const previousMilestone = reached[reached.length - 1] ?? null;

    let progressToNext = 0;
    if (nextMilestone && previousMilestone) {
      const span = nextMilestone.hoursRequired - previousMilestone.hoursRequired;
      const done = smokeFreeHours - previousMilestone.hoursRequired;
      progressToNext = Math.min(100, Math.round((done / span) * 100));
    } else if (!previousMilestone && nextMilestone) {
      progressToNext = Math.min(100, Math.round((smokeFreeHours / nextMilestone.hoursRequired) * 100));
    }

    return { reached, upcoming, nextMilestone, progressToNext };
  }, [smokeFreeHours]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-rose-500" />
          Body Recovery
        </CardTitle>
        <CardDescription>
          {reached.length === 0
            ? 'Your body starts healing within 20 minutes of quitting'
            : `${reached.length} healing milestone${reached.length !== 1 ? 's' : ''} reached`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next milestone highlight */}
        {nextMilestone && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{nextMilestone.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{nextMilestone.title}</p>
                  <p className="text-xs text-muted-foreground">
                    In {formatHoursToLabel(Math.max(0, nextMilestone.hoursRequired - smokeFreeHours))}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">{progressToNext}%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        )}

        {/* Reached milestones (last 3 shown inline, rest collapsed) */}
        {reached.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Already unlocked
            </p>
            {[...reached].reverse().slice(0, 4).map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30"
              >
                <span className="text-lg leading-none">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{m.title}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{m.fact}</p>
                </div>
                <span className="text-xs text-primary font-bold flex-shrink-0">✓</span>
              </div>
            ))}
            {reached.length > 4 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{reached.length - 4} more milestones reached
              </p>
            )}
          </div>
        )}

        {/* Upcoming sneak peek */}
        {upcoming.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Coming up
            </p>
            {upcoming.slice(1, 3).map(m => (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-lg opacity-50 grayscale'
                )}
              >
                <span className="text-lg leading-none">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    in {formatHoursToLabel(m.hoursRequired)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">🔒</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
