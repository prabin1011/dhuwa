
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { WeeklyChallengeProgress } from '@/lib/weekly-challenges';

interface WeeklyChallengeCardProps {
  challenge: WeeklyChallengeProgress;
}

export function WeeklyChallengeCard({ challenge }: WeeklyChallengeCardProps) {
  const { title, description, xp, icon, motivationalNote, current, target, completed } = challenge;
  const pct = Math.min(100, Math.round((current / target) * 100));

  // Arc geometry for the progress ring
  const SIZE = 80;
  const STROKE = 7;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dash = (pct / 100) * CIRC;
  const gap = CIRC - dash;

  return (
    <Card className={cn(
      'overflow-hidden border-2 transition-colors',
      completed ? 'border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/20' : 'border-border'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span>{icon}</span> Weekly Challenge
          </CardTitle>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
            <Zap className="w-3 h-3" />
            {xp} XP
          </span>
        </div>
        <CardDescription>Resets every Monday</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-5">
          {/* Progress ring */}
          <div className="relative flex-shrink-0">
            <svg width={SIZE} height={SIZE} className="-rotate-90">
              {/* Track */}
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                strokeWidth={STROKE}
                className="stroke-secondary"
              />
              {/* Progress */}
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-700',
                  completed ? 'stroke-amber-400' : 'stroke-primary'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-none tabular-nums">{pct}%</span>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-semibold text-sm leading-tight">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
              <span className={cn(completed ? 'text-amber-500' : 'text-primary')}>
                {current}
              </span>
              <span className="text-muted-foreground">/ {target}</span>
              {completed && <span className="text-amber-500 ml-1">✓ Complete!</span>}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground italic border-t border-border pt-3 leading-relaxed">
          "{motivationalNote}"
        </p>
      </CardContent>
    </Card>
  );
}
