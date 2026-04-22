
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { GamificationStats } from '@/lib/gamification';

interface DashboardHeroProps {
  stats: GamificationStats;
  username?: string;
  shields?: number;
}

const MILESTONES = [
  { days: 365, label: '1 Year',  color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { days: 90,  label: '90 Days', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  { days: 30,  label: '30 Days', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { days: 14,  label: '2 Weeks', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { days: 7,   label: '1 Week',  color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  { days: 3,   label: '3 Days',  color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { days: 1,   label: '1 Day',   color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
];

function flameColor(days: number): string {
  if (days >= 30) return 'drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]';
  if (days >= 7)  return 'drop-shadow-[0_0_8px_rgba(249,115,22,0.7)]';
  if (days >= 3)  return 'drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]';
  if (days >= 1)  return 'drop-shadow-[0_0_4px_rgba(234,179,8,0.5)]';
  return '';
}

function StreakMilestoneTag({ days }: { days: number }) {
  const nextMilestone = [...MILESTONES].reverse().find(m => m.days > days);
  if (!nextMilestone) return null;
  const daysLeft = nextMilestone.days - days;
  return (
    <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', nextMilestone.color)}>
      {daysLeft}d to {nextMilestone.label}
    </span>
  );
}

export function DashboardHero({ stats, username, shields = 0 }: DashboardHeroProps) {
  const {
    currentLevel, nextLevel,
    xpIntoCurrentLevel, xpNeededForNextLevel,
    progressPercent,
    currentStreakDays, longestStreakDays,
    totalXp,
  } = stats;

  const greetingEmoji = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? '🌅' : h < 17 ? '☀️' : '🌙';
  }, []);

  const nearLevelUp = progressPercent >= 80;

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-raised relative">
      {/* subtle top gradient strip */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="p-5 space-y-5">

        {/* ── Row 1: greeting + level + XP badge ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              {greetingEmoji} {username ? `Hey, ${username}` : 'Welcome back'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-primary leading-none">Lv.{currentLevel.level}</span>
              <span className="text-lg font-semibold leading-none text-foreground/80">{currentLevel.name}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
              <span className="text-sm leading-none">⚡</span>
              <span className="text-sm font-bold text-primary tabular">{totalXp.toLocaleString()} XP</span>
            </div>
            {shields > 0 && (
              <div className="flex items-center gap-1 text-xs text-blue-500 font-semibold bg-blue-50 dark:bg-blue-950/40 rounded-full px-2.5 py-1">
                🛡️ {shields} {shields === 1 ? 'shield' : 'shields'}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Big streak display ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(
              'text-5xl leading-none select-none animate-float',
              flameColor(currentStreakDays)
            )}>
              {currentStreakDays >= 1 ? '🔥' : '💨'}
            </span>
            <div>
              <p className="text-4xl font-bold leading-none tabular">
                {currentStreakDays}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {currentStreakDays === 1 ? 'day smoke-free' : 'days smoke-free'}
              </p>
              {longestStreakDays > currentStreakDays && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Best: {longestStreakDays}d
                </p>
              )}
            </div>
          </div>
          <StreakMilestoneTag days={currentStreakDays} />
        </div>

        {/* ── Row 3: XP progress bar ── */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {nextLevel ? (
              <>
                <span className="tabular">{xpIntoCurrentLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP</span>
                <span>Next: <span className="text-foreground font-semibold">{nextLevel.name}</span></span>
              </>
            ) : (
              <span className="text-primary font-semibold">Max level — you are a Dhuwa Legend! 🏆</span>
            )}
          </div>

          {/* Custom progress bar with shimmer near level-up */}
          <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                nearLevelUp
                  ? 'bg-[length:200%_100%] bg-gradient-to-r from-primary via-accent to-primary animate-shimmer'
                  : 'bg-primary'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
