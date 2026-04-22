
// Achievement/Badge definitions and unlock logic

export type AchievementCategory = 'streaks' | 'health' | 'engagement' | 'savings' | 'community';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  icon: string;
  title: string;
  description: string;
  // Returns true if this achievement should be unlocked given current stats
  check: (stats: AchievementCheckParams) => boolean;
}

export interface AchievementCheckParams {
  currentStreakDays: number;
  longestStreakDays: number;
  totalUrgeCount: number;
  totalReplacementCount: number;
  smokeFreeHoursTotal: number; // based on longest streak
  moneySavedRaw: number;       // in user currency units
  communityPostCount: number;
  copingToolUses: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Streaks ──────────────────────────────────────────────
  {
    id: 'streak_1d',
    category: 'streaks',
    icon: '🌱',
    title: 'First Step',
    description: '1 day smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 1,
  },
  {
    id: 'streak_3d',
    category: 'streaks',
    icon: '🔥',
    title: 'On Fire',
    description: '3 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 3,
  },
  {
    id: 'streak_7d',
    category: 'streaks',
    icon: '💪',
    title: 'Week Warrior',
    description: '7 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 7,
  },
  {
    id: 'streak_14d',
    category: 'streaks',
    icon: '🌙',
    title: 'Fortnight Strong',
    description: '14 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 14,
  },
  {
    id: 'streak_30d',
    category: 'streaks',
    icon: '🏆',
    title: 'Monthly Legend',
    description: '30 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 30,
  },
  {
    id: 'streak_60d',
    category: 'streaks',
    icon: '🌟',
    title: 'Two Month Hero',
    description: '60 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 60,
  },
  {
    id: 'streak_90d',
    category: 'streaks',
    icon: '💎',
    title: 'Diamond Streak',
    description: '90 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 90,
  },
  {
    id: 'streak_180d',
    category: 'streaks',
    icon: '🦋',
    title: 'Half Year Free',
    description: '180 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 180,
  },
  {
    id: 'streak_365d',
    category: 'streaks',
    icon: '👑',
    title: 'Year of Freedom',
    description: '365 days smoke-free',
    check: ({ currentStreakDays }) => currentStreakDays >= 365,
  },

  // ── Health Milestones (body recovery timeline) ────────────
  {
    id: 'health_20min',
    category: 'health',
    icon: '❤️',
    title: 'Heart Helper',
    description: 'Blood pressure normalizes (20 min free)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 0.33,
  },
  {
    id: 'health_8h',
    category: 'health',
    icon: '🫁',
    title: 'Fresh Air',
    description: 'Carbon monoxide levels drop (8 hours)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 8,
  },
  {
    id: 'health_24h',
    category: 'health',
    icon: '🧠',
    title: 'Brain Boost',
    description: 'Dopamine receptors begin healing (24 hours)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 24,
  },
  {
    id: 'health_48h',
    category: 'health',
    icon: '👃',
    title: 'Senses Return',
    description: 'Taste & smell improving (48 hours)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 48,
  },
  {
    id: 'health_72h',
    category: 'health',
    icon: '🌿',
    title: 'Lung Opener',
    description: 'Airways relaxing (72 hours)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 72,
  },
  {
    id: 'health_2w',
    category: 'health',
    icon: '🏃',
    title: 'Runner',
    description: 'Circulation improving (2 weeks)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 24 * 14,
  },
  {
    id: 'health_1m',
    category: 'health',
    icon: '💨',
    title: 'Deep Breather',
    description: 'Lung function increasing (1 month)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 24 * 30,
  },
  {
    id: 'health_3m',
    category: 'health',
    icon: '🌬️',
    title: 'Clear Lungs',
    description: 'Coughing decreasing (3 months)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 24 * 90,
  },
  {
    id: 'health_1y',
    category: 'health',
    icon: '💓',
    title: 'Heart Free',
    description: 'Heart disease risk halved (1 year)',
    check: ({ smokeFreeHoursTotal }) => smokeFreeHoursTotal >= 24 * 365,
  },

  // ── Engagement ────────────────────────────────────────────
  {
    id: 'engage_first_log',
    category: 'engagement',
    icon: '📓',
    title: 'First Log',
    description: 'Logged your first urge',
    check: ({ totalUrgeCount }) => totalUrgeCount >= 1,
  },
  {
    id: 'engage_10_logs',
    category: 'engagement',
    icon: '📊',
    title: 'Pattern Spotter',
    description: 'Logged 10 urges',
    check: ({ totalUrgeCount }) => totalUrgeCount >= 10,
  },
  {
    id: 'engage_50_logs',
    category: 'engagement',
    icon: '🎯',
    title: 'Data Warrior',
    description: 'Logged 50 urges',
    check: ({ totalUrgeCount }) => totalUrgeCount >= 50,
  },
  {
    id: 'engage_100_logs',
    category: 'engagement',
    icon: '🏅',
    title: '100 Club',
    description: 'Logged 100 urges — that\'s serious self-awareness',
    check: ({ totalUrgeCount }) => totalUrgeCount >= 100,
  },
  {
    id: 'engage_first_replace',
    category: 'engagement',
    icon: '🔄',
    title: 'Switcher',
    description: 'First replacement activity completed',
    check: ({ totalReplacementCount }) => totalReplacementCount >= 1,
  },
  {
    id: 'engage_10_replace',
    category: 'engagement',
    icon: '✨',
    title: 'Habit Swapper',
    description: '10 replacement activities completed',
    check: ({ totalReplacementCount }) => totalReplacementCount >= 10,
  },
  {
    id: 'engage_coping',
    category: 'engagement',
    icon: '🧘',
    title: 'Calm Keeper',
    description: 'Used a coping tool 5 times',
    check: ({ copingToolUses }) => copingToolUses >= 5,
  },

  // ── Savings ───────────────────────────────────────────────
  {
    id: 'savings_10',
    category: 'savings',
    icon: '💰',
    title: 'Penny Saver',
    description: 'Saved $10 (or equivalent)',
    check: ({ moneySavedRaw }) => moneySavedRaw >= 10,
  },
  {
    id: 'savings_50',
    category: 'savings',
    icon: '💵',
    title: 'Frugal Fighter',
    description: 'Saved $50',
    check: ({ moneySavedRaw }) => moneySavedRaw >= 50,
  },
  {
    id: 'savings_100',
    category: 'savings',
    icon: '💸',
    title: 'Big Saver',
    description: 'Saved $100 — treat yourself!',
    check: ({ moneySavedRaw }) => moneySavedRaw >= 100,
  },
  {
    id: 'savings_500',
    category: 'savings',
    icon: '🤑',
    title: 'Financial Free',
    description: 'Saved $500',
    check: ({ moneySavedRaw }) => moneySavedRaw >= 500,
  },

  // ── Community ─────────────────────────────────────────────
  {
    id: 'community_first',
    category: 'community',
    icon: '👋',
    title: 'Hello World',
    description: 'First community share',
    check: ({ communityPostCount }) => communityPostCount >= 1,
  },
  {
    id: 'community_10',
    category: 'community',
    icon: '🤝',
    title: 'Community Voice',
    description: 'Shared 10 victories',
    check: ({ communityPostCount }) => communityPostCount >= 10,
  },
];

export function computeUnlockedAchievements(params: AchievementCheckParams): Set<string> {
  const unlocked = new Set<string>();
  for (const a of ACHIEVEMENTS) {
    if (a.check(params)) unlocked.add(a.id);
  }
  return unlocked;
}
