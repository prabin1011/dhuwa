
'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { getDailyMissionPool } from '@/lib/daily-missions';
import type { DailyMission } from '@/lib/daily-missions';

export interface UseDailyMissionsResult {
  missions: DailyMission[];
  isLoading: boolean;
  completeMission: (missionId: string) => Promise<void>;
  allCompleted: boolean;
  completedCount: number;
}

export function useDailyMissions(goal?: string): UseDailyMissionsResult {
  const { firestore, user } = useFirebase();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }

    const ref = doc(firestore, 'users', user.uid, 'dailyMissions', today);

    const load = async () => {
      setIsLoading(true);
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setMissions(data.missions as DailyMission[]);
        } else {
          // Generate fresh missions for today
          const pool = getDailyMissionPool(today, goal);
          const fresh: DailyMission[] = pool.map(m => ({
            ...m,
            date: today,
            completed: false,
          }));
          await setDoc(ref, { missions: fresh, createdAt: serverTimestamp() });
          setMissions(fresh);
        }
      } catch {
        // If offline or error, still show generated missions locally
        const pool = getDailyMissionPool(today, goal);
        setMissions(pool.map(m => ({ ...m, date: today, completed: false })));
      } finally {
        setIsLoading(false);
      }
    };

    load();
    // Only re-run when user/date changes, not on goal changes to avoid flicker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, firestore, today]);

  const completeMission = useCallback(async (missionId: string) => {
    if (!user || !firestore) return;

    setMissions(prev =>
      prev.map(m =>
        m.id === missionId
          ? { ...m, completed: true, completedAt: new Date().toISOString() }
          : m
      )
    );

    const ref = doc(firestore, 'users', user.uid, 'dailyMissions', today);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const current = snap.data().missions as DailyMission[];
        const updated = current.map((m: DailyMission) =>
          m.id === missionId
            ? { ...m, completed: true, completedAt: new Date().toISOString() }
            : m
        );
        await updateDoc(ref, { missions: updated });
      }
    } catch {
      // Optimistic update already applied above; silently fail if offline
    }
  }, [user, firestore, today]);

  const completedCount = missions.filter(m => m.completed).length;
  const allCompleted = missions.length > 0 && completedCount === missions.length;

  return { missions, isLoading, completeMission, allCompleted, completedCount };
}
