
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Zap } from 'lucide-react';
import type { DailyMission } from '@/lib/daily-missions';
import { useToast } from '@/hooks/use-toast';

interface DailyMissionsCardProps {
  missions: DailyMission[];
  isLoading: boolean;
  completedCount: number;
  allCompleted: boolean;
  onCompleteMission: (id: string) => void;
}

const MISSION_ICONS: Record<string, string> = {
  open_morning: '🌅',
  log_urge_day: '📓',
  log_2_urges: '📊',
  replacement_today: '🔄',
  breathe: '🧘',
  ground: '🌿',
  surf: '🌊',
  check_savings: '💰',
  share_victory: '🤝',
  mood_after: '💭',
  replacement_mood: '✨',
  smoke_free_noon: '☀️',
  three_hour_gap: '⏱️',
  read_insight: '💡',
};

function MissionRow({
  mission,
  onComplete,
}: {
  mission: DailyMission;
  onComplete: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all',
        mission.completed
          ? 'bg-primary/5 opacity-70'
          : 'bg-secondary/30 hover:bg-secondary/50'
      )}
    >
      <span className="text-2xl w-8 text-center flex-shrink-0 leading-none">
        {MISSION_ICONS[mission.id] ?? '⭐'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold leading-tight', mission.completed && 'line-through text-muted-foreground')}>
          {mission.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{mission.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
          <Zap className="w-3 h-3" />
          {mission.xp}
        </span>
        {mission.completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 rounded-full"
            onClick={onComplete}
            aria-label={`Complete mission: ${mission.title}`}
          >
            <Circle className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DailyMissionsCard({
  missions,
  isLoading,
  completedCount,
  allCompleted,
  onCompleteMission,
}: DailyMissionsCardProps) {
  const { toast } = useToast();

  const handleComplete = (mission: DailyMission) => {
    if (mission.completed) return;
    onCompleteMission(mission.id);
    const isLast = completedCount + 1 === missions.length;
    toast({
      title: `+${mission.xp} XP earned!`,
      description: isLast
        ? `${mission.title} ✓ — All missions done! +100 bonus XP`
        : `${mission.title} ✓`,
      duration: 3000,
    });
  };
  const totalXp = missions.reduce((s, m) => s + (m.completed ? m.xp : 0), 0);
  const maxXp = missions.reduce((s, m) => s + m.xp, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily Missions</CardTitle>
          <CardDescription>Loading today's missions…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(allCompleted && 'border-primary/40 bg-primary/5')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {allCompleted ? '🎉' : '🎯'} Daily Missions
          </CardTitle>
          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {totalXp}/{maxXp} XP
          </span>
        </div>
        <CardDescription>
          {allCompleted
            ? 'All missions complete! +100 bonus XP earned.'
            : `${completedCount}/${missions.length} completed today`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {missions.map(mission => (
          <MissionRow
            key={mission.id}
            mission={mission}
            onComplete={() => handleComplete(mission)}
          />
        ))}
        {allCompleted && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            New missions arrive at midnight 🌙
          </p>
        )}
      </CardContent>
    </Card>
  );
}
