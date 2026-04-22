
'use client';

import { useMemo } from 'react';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { getGamificationStats } from '@/lib/gamification';
import { computeUnlockedAchievements, ACHIEVEMENTS } from '@/lib/achievements';
import type { GamificationStats } from '@/lib/gamification';
import type { Achievement } from '@/lib/achievements';

interface Urge {
  timestamp: Timestamp;
  type?: string;
  count?: number;
}

interface SmokingMoment {
  id: string;
  replacementActivity?: Record<string, { activity: string; mood?: string }>;
}

interface UserProfile {
  moments?: SmokingMoment[];
  habitDetails?: Record<string, { packCost?: number; itemsPerPack?: number; itemsPerDay?: string | number }>;
  currency?: string;
  goal?: string;
}

export interface GamificationData {
  stats: GamificationStats;
  unlockedIds: Set<string>;
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  totalReplacementCount: number;
  moneySavedRaw: number;
}

function computeMoneySaved(
  urges: WithId<Urge>[],
  profile: UserProfile
): number {
  const hd = profile.habitDetails || {};
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let saved = 0;
  for (const habit of Object.keys(hd)) {
    const details = hd[habit];
    const packCost = Number(details?.packCost ?? 0);
    const itemsPerPack = Number(details?.itemsPerPack ?? 1);
    const itemsPerDay = Number(details?.itemsPerDay ?? 0);
    if (!packCost || !itemsPerPack || !itemsPerDay) continue;

    const costPerItem = packCost / itemsPerPack;
    const weeklyUrges = urges.filter(
      u => u.type === habit && u.timestamp.toDate() >= sevenDaysAgo
    );
    const smoked = weeklyUrges.reduce((s, u) => s + (u.count ?? 1), 0);
    const expected = itemsPerDay * 7;
    if (expected > smoked) saved += (expected - smoked) * costPerItem;
  }
  return saved;
}

export function useGamification(
  urges: WithId<Urge>[],
  userProfile: UserProfile
): GamificationData {
  return useMemo(() => {
    const replacementCount = (userProfile.moments || []).reduce((acc, m) => {
      return acc + Object.keys(m.replacementActivity || {}).length;
    }, 0);

    const moneySavedRaw = computeMoneySaved(urges, userProfile);

    const stats = getGamificationStats({
      urgeCount: urges.length,
      replacementCount,
      checkinCount: 0, // checkins tracked separately via Firestore
      bonusXp: 0,      // mission bonus XP added separately
      urges,
    });

    const checkParams = {
      currentStreakDays: stats.currentStreakDays,
      longestStreakDays: stats.longestStreakDays,
      totalUrgeCount: urges.length,
      totalReplacementCount: replacementCount,
      smokeFreeHoursTotal: stats.currentStreakMs / (1000 * 60 * 60),
      moneySavedRaw,
      communityPostCount: 0, // fetched separately if needed
      copingToolUses: 0,     // tracked separately if needed
    };

    const unlockedIds = computeUnlockedAchievements(checkParams);
    const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id));
    const lockedAchievements = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id));

    return {
      stats,
      unlockedIds,
      unlockedAchievements,
      lockedAchievements,
      totalReplacementCount: replacementCount,
      moneySavedRaw,
    };
  }, [urges, userProfile]);
}
