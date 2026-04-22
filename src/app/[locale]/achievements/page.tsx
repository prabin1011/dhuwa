'use client';

import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { useFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';
import { useGamification } from '@/hooks/use-gamification';
import { ACHIEVEMENTS, type Achievement, type AchievementCategory } from '@/lib/achievements';
import { LEVELS } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Urge {
  timestamp: Timestamp;
  type?: string;
  count?: number;
}

const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string; color: string }> = {
  streaks:    { label: 'Streaks',    icon: '🔥', color: 'from-orange-500/10 to-amber-500/5' },
  health:     { label: 'Health',     icon: '❤️', color: 'from-rose-500/10 to-pink-500/5' },
  engagement: { label: 'Engagement', icon: '📊', color: 'from-blue-500/10 to-indigo-500/5' },
  savings:    { label: 'Savings',    icon: '💰', color: 'from-green-500/10 to-emerald-500/5' },
  community:  { label: 'Community',  icon: '🤝', color: 'from-purple-500/10 to-violet-500/5' },
};

const CATEGORIES: AchievementCategory[] = ['streaks', 'health', 'engagement', 'savings', 'community'];

function BadgeTile({ achievement, unlocked, onTap }: {
  achievement: Achievement;
  unlocked: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center w-full transition-all active:scale-95',
        unlocked
          ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
          : 'border-border/30 bg-secondary/20 opacity-40 grayscale'
      )}
    >
      <span className="text-3xl leading-none">{achievement.icon}</span>
      <span className="text-xs font-semibold leading-tight line-clamp-2">{achievement.title}</span>
      {unlocked && <span className="text-[10px] text-primary font-bold">EARNED</span>}
    </button>
  );
}

export default function AchievementsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { locale } = useParams() as { locale: Locale };
  const [selected, setSelected] = useState<Achievement | null>(null);

  const urgesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'urges'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const { data: urges } = useCollection<Urge>(urgesQuery);

  // We need userProfile for the gamification hook — read from a simple doc hook
  const profileQuery = useMemoFirebase(() => {
    if (!user) return null;
    return null; // profile is loaded by parent — use minimal version here
  }, [user]);

  const gamification = useGamification(urges ?? [], {});

  const { stats, unlockedIds } = gamification;
  const unlockedCount = unlockedIds.size;
  const totalCount = ACHIEVEMENTS.length;
  const completionPct = Math.round((unlockedCount / totalCount) * 100);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6 space-y-4">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Please log in to view your achievements.</p>
          <Button asChild><Link href={`/${locale}/login`}>Log In</Link></Button>
        </div>
      </div>
    );
  }

  const currentLevelDef = LEVELS.find(l => l.level === stats.currentLevel.level) ?? LEVELS[0];
  const nextLevelDef = LEVELS.find(l => l.level === stats.currentLevel.level + 1) ?? null;

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto max-w-md px-4 h-16 flex items-center gap-4">
            <Link href={`/${locale}/dashboard`} className="p-2 rounded-full hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Achievements</h1>
              <p className="text-sm text-muted-foreground">{unlockedCount} of {totalCount} earned</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-md p-4 pb-16 space-y-6">
          {/* Level + XP card */}
          <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Level</p>
                <p className="text-2xl font-bold mt-0.5">
                  Lv.{currentLevelDef.level} — {currentLevelDef.name}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-bold text-primary">{stats.totalXp.toLocaleString()} XP</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.xpIntoCurrentLevel.toLocaleString()} / {stats.xpNeededForNextLevel.toLocaleString()} XP</span>
                {nextLevelDef && <span>Next: {nextLevelDef.name}</span>}
              </div>
              <Progress value={stats.progressPercent} className="h-2" />
            </div>
          </div>

          {/* Collection progress */}
          <div className="rounded-2xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Collection
              </p>
              <span className="text-xs text-muted-foreground">{completionPct}% complete</span>
            </div>
            <Progress value={completionPct} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{totalCount - unlockedCount} badges still to unlock</p>
          </div>

          {/* Badge categories */}
          {CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat];
            const catBadges = ACHIEVEMENTS.filter(a => a.category === cat);
            const catUnlocked = catBadges.filter(a => unlockedIds.has(a.id)).length;

            return (
              <div key={cat} className={cn('rounded-2xl p-4 space-y-3 bg-gradient-to-br', meta.color, 'border border-border/50')}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <span>{meta.icon}</span> {meta.label}
                  </h2>
                  <span className="text-xs text-muted-foreground">{catUnlocked}/{catBadges.length}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {catBadges.map(a => (
                    <BadgeTile
                      key={a.id}
                      achievement={a}
                      unlocked={unlockedIds.has(a.id)}
                      onTap={() => setSelected(a)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </main>
      </div>

      {/* Badge detail dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <div className="text-6xl text-center mb-2">{selected.icon}</div>
              <DialogTitle className="text-center text-xl">{selected.title}</DialogTitle>
              <DialogDescription className="text-center">{selected.description}</DialogDescription>
            </DialogHeader>
            <div className="text-center mt-2">
              {unlockedIds.has(selected.id) ? (
                <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-5 py-2 rounded-full">
                  ✓ Unlocked — well done!
                </span>
              ) : (
                <span className="inline-block bg-secondary text-muted-foreground text-sm px-5 py-2 rounded-full">
                  🔒 Not yet — keep going
                </span>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
