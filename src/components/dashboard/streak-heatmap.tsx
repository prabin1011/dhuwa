
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { CalendarDays } from 'lucide-react';

interface Urge {
  timestamp: Timestamp;
}

interface StreakHeatmapProps {
  urges: WithId<Urge>[];
  currentStreakDays: number;
  longestStreakDays: number;
}

// Compute a smoke-free intensity for each day in the last N days
// 0 = smoked heavily, 1 = light, 2 = smoke-free, 3 = no data (before tracking)
function getDayStatus(
  urgesOnDay: number,
  hasData: boolean,
): 'free' | 'light' | 'heavy' | 'none' {
  if (!hasData) return 'none';
  if (urgesOnDay === 0) return 'free';
  if (urgesOnDay <= 2) return 'light';
  return 'heavy';
}

const STATUS_CLASSES = {
  free:  'bg-primary opacity-90',
  light: 'bg-amber-400 dark:bg-amber-600 opacity-80',
  heavy: 'bg-rose-400 dark:bg-rose-600 opacity-70',
  none:  'bg-secondary/40',
};

const STATUS_TOOLTIPS = {
  free:  'Smoke-free',
  light: '1-2 smokes',
  heavy: '3+ smokes',
  none:  'No data',
};

export function StreakHeatmap({ urges, currentStreakDays, longestStreakDays }: StreakHeatmapProps) {
  const DAYS = 84; // 12 weeks

  const { cells, weekLabels } = useMemo(() => {
    const today = new Date();
    const start = subDays(today, DAYS - 1);
    const days = eachDayOfInterval({ start, end: today });

    // earliest urge date to detect "no data" period
    const earliestUrge = urges.length > 0
      ? new Date(Math.min(...urges.map(u => u.timestamp.toDate().getTime())))
      : today;

    const cells = days.map(day => {
      const hasData = day >= earliestUrge || isSameDay(day, earliestUrge);
      const urgesOnDay = urges.filter(u => isSameDay(u.timestamp.toDate(), day)).length;
      return {
        date: day,
        label: format(day, 'MMM d'),
        status: getDayStatus(urgesOnDay, hasData),
        isToday: isSameDay(day, today),
      };
    });

    // Week-start labels (every 4 weeks)
    const weekLabels: string[] = [];
    for (let i = 0; i < 12; i += 4) {
      const labelDay = days[i * 7] ?? days[0];
      weekLabels.push(format(labelDay, 'MMM d'));
    }

    return { cells, weekLabels };
  }, [urges]);

  // Group into weeks (columns of 7)
  const weeks: (typeof cells[0])[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Streak Calendar
        </CardTitle>
        <CardDescription>
          Last 12 weeks — green = smoke-free day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{currentStreakDays}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Current streak (days)</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-2xl font-bold">{longestStreakDays}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Longest streak (days)</p>
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1 min-w-max">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={`${cell.label}: ${STATUS_TOOLTIPS[cell.status]}`}
                    className={cn(
                      'w-4 h-4 rounded-sm transition-colors',
                      STATUS_CLASSES[cell.status],
                      cell.isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-3 flex-wrap">
          {(Object.entries(STATUS_CLASSES) as [keyof typeof STATUS_CLASSES, string][])
            .filter(([k]) => k !== 'none')
            .map(([status, cls]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-sm', cls)} />
                <span className="text-xs text-muted-foreground">{STATUS_TOOLTIPS[status]}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
