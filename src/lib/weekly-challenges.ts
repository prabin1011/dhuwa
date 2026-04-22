
// Weekly Challenge system — one big challenge per Mon–Sun week

import { startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns';

export type ChallengeType =
  | 'replacements_this_week'
  | 'streak_days'
  | 'urges_logged'
  | 'smoke_free_days'
  | 'coping_tools_used';

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: ChallengeType;
  target: number;
  icon: string;
  motivationalNote: string;
}

export interface WeeklyChallengeProgress extends WeeklyChallenge {
  weekKey: string;        // e.g. "2026-W17"
  current: number;
  completed: boolean;
  completedAt?: string;
}

const CHALLENGE_POOL: WeeklyChallenge[] = [
  {
    id: 'replace_5',
    title: 'The Switcher',
    description: 'Complete 5 replacement activities this week',
    xp: 350,
    type: 'replacements_this_week',
    target: 5,
    icon: '🔄',
    motivationalNote: 'Each replacement rewires the habit loop. Five in a week is powerful.',
  },
  {
    id: 'replace_10',
    title: 'Habit Architect',
    description: 'Complete 10 replacement activities this week',
    xp: 600,
    type: 'replacements_this_week',
    target: 10,
    icon: '🏗️',
    motivationalNote: 'Ten replacements means ten moments you chose yourself over the habit.',
  },
  {
    id: 'streak_3',
    title: 'Three-Day Warrior',
    description: 'Stay smoke-free for 3 consecutive days',
    xp: 400,
    type: 'streak_days',
    target: 3,
    icon: '⚡',
    motivationalNote: 'Three days triggers measurable changes in your brain chemistry.',
  },
  {
    id: 'streak_5',
    title: 'Five-Day Champion',
    description: 'Stay smoke-free for 5 consecutive days',
    xp: 650,
    type: 'streak_days',
    target: 5,
    icon: '🏅',
    motivationalNote: 'Five days — your body has already flushed most of the nicotine.',
  },
  {
    id: 'log_10',
    title: 'Honest Tracker',
    description: 'Log at least 10 urges or smokes this week',
    xp: 300,
    type: 'urges_logged',
    target: 10,
    icon: '📓',
    motivationalNote: 'Radical honesty is the first step. Data beats denial every time.',
  },
  {
    id: 'log_20',
    title: 'Pattern Hunter',
    description: 'Log 20 entries this week — spot your triggers',
    xp: 500,
    type: 'urges_logged',
    target: 20,
    icon: '🔍',
    motivationalNote: '20 entries gives the AI enough data to pinpoint your peak risk windows.',
  },
  {
    id: 'free_days_3',
    title: 'Clear Sky Week',
    description: 'Have 3 completely smoke-free days this week',
    xp: 450,
    type: 'smoke_free_days',
    target: 3,
    icon: '☁️',
    motivationalNote: 'Three clear days this week. Each one gets a little easier than the last.',
  },
  {
    id: 'free_days_5',
    title: 'Smoke-Free Majority',
    description: 'Have 5 completely smoke-free days this week',
    xp: 700,
    type: 'smoke_free_days',
    target: 5,
    icon: '🌤️',
    motivationalNote: 'Five free days means you spent most of this week on your terms.',
  },
  {
    id: 'coping_3',
    title: 'Calm Mind',
    description: 'Use a coping tool 3 times this week',
    xp: 300,
    type: 'coping_tools_used',
    target: 3,
    icon: '🧘',
    motivationalNote: 'Breathing and grounding build the muscle memory that replaces the habit.',
  },
];

// Get week key like "2026-W17" from a date
export function getWeekKey(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const week = format(weekStart, 'YYYY-[W]ww');
  return week;
}

// Deterministic challenge selection by week key
function weekSeed(weekKey: string): number {
  return weekKey.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
}

export function getWeeklyChallenge(weekKey: string): WeeklyChallenge {
  const seed = weekSeed(weekKey);
  return CHALLENGE_POOL[Math.abs(seed) % CHALLENGE_POOL.length];
}

// Compute progress for a given challenge from live data
export function computeChallengeProgress(
  challenge: WeeklyChallenge,
  params: {
    urges: { timestamp: { toDate(): Date }; count?: number }[];
    moments: { replacementActivity?: Record<string, { activity: string }> }[];
    currentStreakDays: number;
    copingToolUses: number;
  }
): number {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const inThisWeek = (d: Date) => isWithinInterval(d, { start: weekStart, end: weekEnd });

  switch (challenge.type) {
    case 'replacements_this_week': {
      let count = 0;
      for (const m of params.moments) {
        for (const key of Object.keys(m.replacementActivity ?? {})) {
          // key is "yyyy-MM-dd"
          const [y, mo, d] = key.split('-').map(Number);
          const date = new Date(y, mo - 1, d);
          if (inThisWeek(date)) count++;
        }
      }
      return count;
    }
    case 'streak_days':
      return Math.min(params.currentStreakDays, challenge.target);
    case 'urges_logged':
      return params.urges.filter(u => inThisWeek(u.timestamp.toDate())).length;
    case 'smoke_free_days': {
      // Count distinct dates in this week with zero urges
      const smokedDates = new Set(
        params.urges
          .filter(u => inThisWeek(u.timestamp.toDate()))
          .map(u => format(u.timestamp.toDate(), 'yyyy-MM-dd'))
      );
      // Days in this week up to today
      let freeDays = 0;
      const cursor = new Date(weekStart);
      while (cursor <= now) {
        if (!smokedDates.has(format(cursor, 'yyyy-MM-dd'))) freeDays++;
        cursor.setDate(cursor.getDate() + 1);
      }
      return freeDays;
    }
    case 'coping_tools_used':
      return params.copingToolUses;
    default:
      return 0;
  }
}
