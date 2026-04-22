
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS, type Achievement, type AchievementCategory } from '@/lib/achievements';
import { Trophy } from 'lucide-react';

interface AchievementGalleryProps {
  unlockedIds: Set<string>;
}

const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  streaks:    { label: 'Streaks',     icon: '🔥' },
  health:     { label: 'Health',      icon: '❤️' },
  engagement: { label: 'Engagement',  icon: '📊' },
  savings:    { label: 'Savings',     icon: '💰' },
  community:  { label: 'Community',   icon: '🤝' },
};

const CATEGORIES: AchievementCategory[] = ['streaks', 'health', 'engagement', 'savings', 'community'];

function BadgeChip({
  achievement,
  unlocked,
  onClick,
}: {
  achievement: Achievement;
  unlocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center w-full',
        unlocked
          ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer'
          : 'border-border/30 bg-secondary/20 opacity-40 grayscale cursor-pointer'
      )}
      aria-label={achievement.title}
    >
      <span className="text-2xl leading-none">{achievement.icon}</span>
      <span className="text-xs font-semibold leading-tight line-clamp-2">{achievement.title}</span>
    </button>
  );
}

export function AchievementGallery({ unlockedIds }: AchievementGalleryProps) {
  const [selected, setSelected] = useState<Achievement | null>(null);

  const unlockedCount = unlockedIds.size;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Achievements
            </CardTitle>
            <span className="text-xs text-muted-foreground font-medium">
              {unlockedCount}/{totalCount} unlocked
            </span>
          </div>
          <CardDescription>
            {unlockedCount === 0
              ? 'Complete your first streak to earn badges'
              : `${unlockedCount} badge${unlockedCount !== 1 ? 's' : ''} earned — keep going!`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {CATEGORIES.map(cat => {
            const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
            const catUnlocked = catAchievements.filter(a => unlockedIds.has(a.id)).length;
            const { label, icon } = CATEGORY_LABELS[cat];

            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm">{icon}</span>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </h4>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {catUnlocked}/{catAchievements.length}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {catAchievements.map(a => (
                    <BadgeChip
                      key={a.id}
                      achievement={a}
                      unlocked={unlockedIds.has(a.id)}
                      onClick={() => setSelected(a)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <div className="text-5xl text-center mb-2">{selected.icon}</div>
              <DialogTitle className="text-center">{selected.title}</DialogTitle>
              <DialogDescription className="text-center">
                {selected.description}
              </DialogDescription>
            </DialogHeader>
            <div className="text-center">
              {unlockedIds.has(selected.id) ? (
                <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full">
                  ✓ Unlocked
                </span>
              ) : (
                <span className="inline-block bg-secondary text-muted-foreground text-sm px-4 py-1.5 rounded-full">
                  🔒 Locked — keep going!
                </span>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
