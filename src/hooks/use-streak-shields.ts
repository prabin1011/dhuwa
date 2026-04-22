
'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

interface UseStreakShieldsResult {
  shields: number;
  consumeShield: () => Promise<boolean>; // returns true if a shield was available and consumed
}

export function useStreakShields(currentStreakDays: number): UseStreakShieldsResult {
  const { firestore, user } = useFirebase();
  const [shields, setShields] = useState(0);
  // Track how many shields have been awarded for the current streak milestone
  const [lastShieldMilestone, setLastShieldMilestone] = useState(0);

  // Listen to shields count from Firestore
  useEffect(() => {
    if (!user || !firestore) return;
    const ref = doc(firestore, 'users', user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setShields(snap.data()?.streakShields ?? 0);
        setLastShieldMilestone(snap.data()?.lastShieldMilestone ?? 0);
      }
    });
    return () => unsub();
  }, [user, firestore]);

  // Award 1 shield every 7 consecutive smoke-free days
  useEffect(() => {
    if (!user || !firestore) return;

    // How many shield milestones have been crossed (0, 7, 14, 21 days...)
    const milestonesReached = Math.floor(currentStreakDays / 7);
    if (milestonesReached > lastShieldMilestone) {
      const newShields = milestonesReached - lastShieldMilestone;
      const ref = doc(firestore, 'users', user.uid);
      updateDoc(ref, {
        streakShields: increment(newShields),
        lastShieldMilestone: milestonesReached,
      }).catch(() => {/* offline — will sync later */});
    }
  }, [currentStreakDays, lastShieldMilestone, user, firestore]);

  const consumeShield = useCallback(async (): Promise<boolean> => {
    if (!user || !firestore || shields <= 0) return false;
    const ref = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(ref, { streakShields: increment(-1) });
      return true;
    } catch {
      return false;
    }
  }, [user, firestore, shields]);

  return { shields, consumeShield };
}
