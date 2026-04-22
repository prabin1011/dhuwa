
'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ACHIEVEMENTS } from '@/lib/achievements';

export function useAchievementToasts(unlockedIds: Set<string>) {
  const { toast } = useToast();
  // Use null on first render so we skip the initial comparison
  const prevRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    // Skip first render (nothing is "newly" unlocked on load)
    if (prevRef.current === null) {
      prevRef.current = new Set(unlockedIds);
      return;
    }

    const prev = prevRef.current;
    const newlyUnlocked: string[] = [];

    for (const id of unlockedIds) {
      if (!prev.has(id)) newlyUnlocked.push(id);
    }

    for (const id of newlyUnlocked) {
      const badge = ACHIEVEMENTS.find(a => a.id === id);
      if (!badge) continue;

      // Stagger toasts slightly if multiple unlocked at once
      const idx = newlyUnlocked.indexOf(id);
      setTimeout(() => {
        toast({
          title: `${badge.icon} Badge Unlocked!`,
          description: `"${badge.title}" — ${badge.description}`,
          duration: 5000,
        });
      }, idx * 800);
    }

    prevRef.current = new Set(unlockedIds);
  }, [unlockedIds, toast]);
}
