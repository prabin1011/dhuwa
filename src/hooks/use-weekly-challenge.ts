
'use client';

import { useMemo, useEffect, useCallback } from 'react';
import { format, startOfWeek } from 'date-fns';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import {
  getWeeklyChallenge,
  computeChallengeProgress,
  type WeeklyChallengeProgress,
} from '@/lib/weekly-challenges';

interface Urge {
  timestamp: Timestamp;
  count?: number;
}
interface Moment {
  replacementActivity?: Record<string, { activity: string }>;
}

export function useWeeklyChallenge(
  urges: WithId<Urge>[],
  moments: Moment[],
  currentStreakDays: number,
): WeeklyChallengeProgress | null {
  const { firestore, user } = useFirebase();

  const weekKey = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(weekStart, "yyyy-'W'ww");
  }, []);

  const challenge = useMemo(() => getWeeklyChallenge(weekKey), [weekKey]);

  const current = useMemo(() =>
    computeChallengeProgress(challenge, {
      urges,
      moments,
      currentStreakDays,
      copingToolUses: 0,
    }),
    [challenge, urges, moments, currentStreakDays]
  );

  const completed = current >= challenge.target;

  // Persist completion to Firestore once
  const persistCompletion = useCallback(async () => {
    if (!user || !firestore || !completed) return;
    const ref = doc(firestore, 'users', user.uid, 'weeklyChallenges', weekKey);
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          challengeId: challenge.id,
          weekKey,
          completedAt: serverTimestamp(),
          xpAwarded: challenge.xp,
        });
      } else if (!snap.data()?.completedAt) {
        await updateDoc(ref, { completedAt: serverTimestamp() });
      }
    } catch {
      // Silently fail offline
    }
  }, [user, firestore, completed, weekKey, challenge]);

  useEffect(() => {
    if (completed) persistCompletion();
  }, [completed, persistCompletion]);

  return {
    ...challenge,
    weekKey,
    current,
    completed,
  };
}
