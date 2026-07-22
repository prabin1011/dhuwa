
// Core XP / Level / Achievement system for Dhuwa
import { timestampToDate, type TimestampLike } from '@/lib/timestamp';

export interface Level {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
}

export const LEVELS: Level[] = [
  { level: 1,  name: 'Spark',          minXp: 0,     maxXp: 99 },
  { level: 2,  name: 'Ember',          minXp: 100,   maxXp: 249 },
  { level: 3,  name: 'Flame',          minXp: 250,   maxXp: 499 },
  { level: 4,  name: 'Smoke Cutter',   minXp: 500,   maxXp: 799 },
  { level: 5,  name: 'Clear Air',      minXp: 800,   maxXp: 1199 },
  { level: 6,  name: 'Breath Taker',   minXp: 1200,  maxXp: 1699 },
  { level: 7,  name: 'Lung Opener',    minXp: 1700,  maxXp: 2299 },
  { level: 8,  name: 'Urge Surfer',    minXp: 2300,  maxXp: 2999 },
  { level: 9,  name: 'Habit Breaker',  minXp: 3000,  maxXp: 3799 },
  { level: 10, name: 'Breath Seeker',  minXp: 3800,  maxXp: 4699 },
  { level: 11, name: 'Mind Over Body', minXp: 4700,  maxXp: 5699 },
  { level: 12, name: 'Clarity Seeker', minXp: 5700,  maxXp: 6799 },
  { level: 13, name: 'Resilient Soul', minXp: 6800,  maxXp: 7999 },
  { level: 14, name: 'Freedom Finder', minXp: 8000,  maxXp: 9299 },
  { level: 15, name: 'Lung Reviver',   minXp: 9300,  maxXp: 10699 },
  { level: 16, name: 'Clean Slate',    minXp: 10700, maxXp: 12299 },
  { level: 17, name: 'Iron Will',      minXp: 12300, maxXp: 13999 },
  { level: 18, name: 'Smoke Slayer',   minXp: 14000, maxXp: 15799 },
  { level: 19, name: 'Pure Breather',  minXp: 15800, maxXp: 17699 },
  { level: 20, name: 'Freedom Keeper', minXp: 17700, maxXp: 19699 },
  { level: 21, name: 'Heart Guardian', minXp: 19700, maxXp: 22499 },
  { level: 22, name: 'Lung Champion',  minXp: 22500, maxXp: 25499 },
  { level: 23, name: 'Vitality Hero',  minXp: 25500, maxXp: 28799 },
  { level: 24, name: 'Smoke Conqueror',minXp: 28800, maxXp: 32399 },
  { level: 25, name: 'Life Reclaimer', minXp: 32400, maxXp: 36199 },
  { level: 26, name: 'Breath Master',  minXp: 36200, maxXp: 40299 },
  { level: 27, name: 'Freedom Warrior',minXp: 40300, maxXp: 44699 },
  { level: 28, name: 'Dhuwa Legend',   minXp: 44700, maxXp: Infinity },
];

// XP rewards for each action
export const XP_REWARDS = {
  LOG_URGE: 25,
  DAILY_CHECKIN: 10,
  REPLACEMENT_ACTIVITY: 75,
  COPING_TOOL: 50,
  COMPLETE_ALL_MISSIONS: 100,
  STREAK_1_DAY: 200,
  STREAK_3_DAYS: 300,
  STREAK_7_DAYS: 500,
  STREAK_14_DAYS: 750,
  STREAK_30_DAYS: 1000,
  STREAK_60_DAYS: 1500,
  STREAK_90_DAYS: 2000,
  STREAK_180_DAYS: 3000,
  STREAK_365_DAYS: 5000,
} as const;

export interface GamificationStats {
  totalXp: number;
  currentLevel: Level;
  nextLevel: Level | null;
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
  currentStreakMs: number;
  currentStreakDays: number;
  longestStreakDays: number;
}

// Compute streak data from sorted urges (newest first)
export function computeStreaks(urges: { timestamp: TimestampLike }[]): {
  currentStreakMs: number;
  currentStreakDays: number;
  longestStreakDays: number;
} {
  const now = new Date();

  // Drop pending serverTimestamp sentinels — they have no toDate() yet
  const valid = urges
    .map((u) => timestampToDate(u.timestamp))
    .filter((date): date is Date => date != null)
    .sort((a, b) => b.getTime() - a.getTime());

  if (valid.length === 0) {
    return { currentStreakMs: 0, currentStreakDays: 0, longestStreakDays: 0 };
  }

  const lastUrge = valid[0];
  const currentStreakMs = Math.max(0, now.getTime() - lastUrge.getTime());
  const currentStreakDays = Math.floor(currentStreakMs / (1000 * 60 * 60 * 24));

  let longestGapMs = currentStreakMs;
  for (let i = 0; i < valid.length - 1; i++) {
    const a = valid[i];
    const b = valid[i + 1];
    const gap = a.getTime() - b.getTime();
    if (gap > longestGapMs) longestGapMs = gap;
  }
  const longestStreakDays = Math.floor(longestGapMs / (1000 * 60 * 60 * 24));

  return { currentStreakMs, currentStreakDays, longestStreakDays };
}

// Compute total XP earned from activity (deterministic from data)
export function computeTotalXp(params: {
  urgeCount: number;
  replacementCount: number;
  checkinCount: number;
  bonusXp: number;
  streakDays: number;
}): number {
  const { urgeCount, replacementCount, checkinCount, bonusXp, streakDays } = params;

  let xp = 0;
  xp += urgeCount * XP_REWARDS.LOG_URGE;
  xp += replacementCount * XP_REWARDS.REPLACEMENT_ACTIVITY;
  xp += checkinCount * XP_REWARDS.DAILY_CHECKIN;
  xp += bonusXp;

  // Streak milestone XP (non-cumulative — awarded once each threshold)
  if (streakDays >= 1)   xp += XP_REWARDS.STREAK_1_DAY;
  if (streakDays >= 3)   xp += XP_REWARDS.STREAK_3_DAYS;
  if (streakDays >= 7)   xp += XP_REWARDS.STREAK_7_DAYS;
  if (streakDays >= 14)  xp += XP_REWARDS.STREAK_14_DAYS;
  if (streakDays >= 30)  xp += XP_REWARDS.STREAK_30_DAYS;
  if (streakDays >= 60)  xp += XP_REWARDS.STREAK_60_DAYS;
  if (streakDays >= 90)  xp += XP_REWARDS.STREAK_90_DAYS;
  if (streakDays >= 180) xp += XP_REWARDS.STREAK_180_DAYS;
  if (streakDays >= 365) xp += XP_REWARDS.STREAK_365_DAYS;

  return xp;
}

export function getLevelForXp(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getGamificationStats(params: {
  urgeCount: number;
  replacementCount: number;
  checkinCount: number;
  bonusXp: number;
  urges: { timestamp: TimestampLike }[];
}): GamificationStats {
  const { urges } = params;
  const { currentStreakMs, currentStreakDays, longestStreakDays } = computeStreaks(urges);

  const totalXp = computeTotalXp({ ...params, streakDays: Math.max(currentStreakDays, longestStreakDays) });
  const currentLevel = getLevelForXp(totalXp);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1) ?? null;

  const xpIntoCurrentLevel = totalXp - currentLevel.minXp;
  const xpNeededForNextLevel = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1;
  const progressPercent = nextLevel
    ? Math.min(100, Math.round((xpIntoCurrentLevel / xpNeededForNextLevel) * 100))
    : 100;

  return {
    totalXp,
    currentLevel,
    nextLevel,
    xpIntoCurrentLevel,
    xpNeededForNextLevel,
    progressPercent,
    currentStreakMs,
    currentStreakDays,
    longestStreakDays,
  };
}
