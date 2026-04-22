
// Daily Mission engine — generates 3 missions per day for the user

export interface Mission {
  id: string;
  title: string;
  description: string;
  xp: number;
  // The type of action required; used to auto-complete in the app
  type: 'open_app' | 'log_urge' | 'replacement' | 'coping_tool' | 'check_savings' | 'community_share' | 'mood_log' | 'any';
}

export interface DailyMission extends Mission {
  date: string;        // yyyy-MM-dd
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

// Pool of all possible missions
export const MISSION_POOL: Mission[] = [
  {
    id: 'open_morning',
    title: 'Morning Check-in',
    description: 'Open the app before 10am',
    xp: 30,
    type: 'open_app',
  },
  {
    id: 'log_urge_day',
    title: 'Track an Urge',
    description: 'Log any urge or smoke today',
    xp: 25,
    type: 'log_urge',
  },
  {
    id: 'replacement_today',
    title: 'Replace It',
    description: 'Complete a smoking moment with a replacement activity',
    xp: 75,
    type: 'replacement',
  },
  {
    id: 'breathe',
    title: 'Breathe Through It',
    description: 'Do one breathing exercise session',
    xp: 50,
    type: 'coping_tool',
  },
  {
    id: 'ground',
    title: 'Ground Yourself',
    description: 'Use the 5-4-3-2-1 grounding technique',
    xp: 50,
    type: 'coping_tool',
  },
  {
    id: 'surf',
    title: 'Surf the Urge',
    description: 'Complete an urge surfing timer session',
    xp: 60,
    type: 'coping_tool',
  },
  {
    id: 'check_savings',
    title: 'Count Your Coins',
    description: 'Check how much money you\'ve saved',
    xp: 20,
    type: 'check_savings',
  },
  {
    id: 'share_victory',
    title: 'Share a Win',
    description: 'Post a replacement victory to the community',
    xp: 80,
    type: 'community_share',
  },
  {
    id: 'mood_after',
    title: 'How Do You Feel?',
    description: 'Log your mood after an urge or craving',
    xp: 40,
    type: 'mood_log',
  },
  {
    id: 'smoke_free_noon',
    title: 'Noon Free',
    description: 'Stay smoke-free until noon today',
    xp: 60,
    type: 'any',
  },
  {
    id: 'three_hour_gap',
    title: 'Time the Gap',
    description: 'Wait at least 3 hours between smokes (or stay free)',
    xp: 50,
    type: 'any',
  },
  {
    id: 'read_insight',
    title: 'Read Your Insight',
    description: "Open today's AI insight card",
    xp: 20,
    type: 'open_app',
  },
  {
    id: 'log_2_urges',
    title: 'Stay Honest',
    description: 'Log at least 2 entries today (smokes or urges)',
    xp: 35,
    type: 'log_urge',
  },
  {
    id: 'replacement_mood',
    title: 'Feel the Difference',
    description: 'Log your mood after a replacement activity',
    xp: 45,
    type: 'mood_log',
  },
];

// Deterministically pick 3 missions for a given date using a simple seed
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dateSeed(date: string): number {
  // yyyy-MM-dd → numeric seed
  return date.split('-').reduce((acc, part) => acc * 100 + parseInt(part, 10), 0);
}

export function getDailyMissionPool(date: string, goal?: string): Mission[] {
  const seed = dateSeed(date);
  let pool = MISSION_POOL;

  // Deprioritise community mission for 'track' goal users
  if (goal === 'track') {
    pool = pool.filter(m => m.id !== 'share_victory');
  }

  const shuffled = seededShuffle(pool, seed);
  return shuffled.slice(0, 3);
}
