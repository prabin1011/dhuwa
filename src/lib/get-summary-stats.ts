import {
  format,
  differenceInHours,
  formatDistanceStrict,
  isAfter,
  subDays,
} from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { timestampToDate } from '@/lib/timestamp';

interface Urge {
  timestamp: Timestamp;
  moodBefore?: string; // used as a lightweight "trigger" proxy
  count?: number;      // cigarettes in that moment
  type?: string;       // e.g. "cigarette"/"vape" to map habitDetails
}

interface SmokingMoment {
  id: string;
  time: string;
  label: string;
  completed: Record<string, boolean>; // key=yyyy-MM-dd
  replacementActivity?: Record<
    string,
    { activity: string; mood?: string }
  >;
}

interface UserProfile {
  goal?: string;
  motivation?: string;
  habitDetails?: Record<
    string,
    { packCost?: number; itemsPerPack?: number; itemsPerDay?: string | number }
  >;
  moments?: SmokingMoment[];
  currency?: string;     // e.g. "USD","INR","NPR"
  breakDuration?: string; // minutes as string
}

export interface SummaryStats {
  // core
  todaySmokes: number;
  yesterdaySmokes: number;
  last7DaysTotal: number;
  last7DaysAverage: number;
  reductionPercent: string;

  // behaviour
  replacementHabit: string;
  urgeCount48h: number;
  mostCommonTrigger: string;
  longestStreak: string;
  currentStreak: string;
  timeSinceLastSmoke: string;
  timeBetweenUrges: string;

  // outcomes
  costSaved: string;
  healthBenefit: string;

  // user context
  mood: string;
  motivation: string;
  goal: string;

  // extras for templates
  previousPattern?: string;
  triggerTime?: string;
  previousCount?: number;
  currentCount?: number;
  delayTime?: string;
  triggerEvent?: string;
  newTrigger?: string;
  emotionTriggerCount?: number;
  routineTriggerCount?: number;
  pattern?: string;
  previousAverage?: number;
  skippedSmokes?: number;
  oldGap?: string;
  newGap?: string;
  minutesSaved?: number;
  smokeFreeHours?: number;
  missedSmokes?: number;
  urgeCount?: number;
  smokeCount?: number;
  slipCount?: number;
  slipReason?: string;
  oldDailyAverage?: number;
  moodAfterSlip?: string;
  slipTime?: string;
  reason?: string;
  [k: string]: string | number | undefined;
}

const byDesc = (a: Urge, b: Urge) =>
  (timestampToDate(b.timestamp)?.getTime() ?? 0) -
  (timestampToDate(a.timestamp)?.getTime() ?? 0);

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

const costsPerItem = (packCost?: number, itemsPerPack?: number) =>
  !packCost || !itemsPerPack ? 0 : Number(packCost) / Number(itemsPerPack);

const money = (amount: number, currency?: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(Math.max(0, amount));

const countCigs = (arr: WithId<Urge>[]) =>
  arr.reduce((sum, u) => sum + (u.count ?? 1), 0);

export function getSummaryStats(
  rawUrges: WithId<Urge>[],
  profile: UserProfile
): SummaryStats {
  const now = new Date();

  // 1) sort newest → oldest
  const urges = [...rawUrges]
    .filter((urge) => timestampToDate(urge.timestamp) != null)
    .sort(byDesc);

  // 2) date buckets
  const todayKey = ymd(now);
  const yesterday = subDays(now, 1);
  const sevenDaysAgo = subDays(now, 7);

  const todayUrges = urges.filter(
    (u) => ymd(timestampToDate(u.timestamp)!) === todayKey
  );
  const yesterdayUrges = urges.filter(
    (u) => ymd(timestampToDate(u.timestamp)!) === ymd(yesterday)
  );
  const last7DaysUrges = urges.filter((u) =>
    isAfter(timestampToDate(u.timestamp)!, sevenDaysAgo)
  );

  const todaySmokes = countCigs(todayUrges);
  const yesterdaySmokes = countCigs(yesterdayUrges);
  const last7DaysTotal = countCigs(last7DaysUrges);
  const last7DaysAverage = last7DaysTotal / 7;

  // 3) streaks
  const newest = timestampToDate(urges[0]?.timestamp);
  const timeSinceLastSmoke =
    newest != null ? formatDistanceStrict(newest, now) : 'the beginning';

  // current streak == time since latest smoke (or 0 if never smoked)
  const currentStreakMs = newest ? now.getTime() - newest.getTime() : 0;

  // longest streak == max gap between consecutive urges
  let longestGapMs = currentStreakMs; // include “now since last” as a candidate
  for (let i = 0; i < urges.length - 1; i++) {
    const a = timestampToDate(urges[i].timestamp)!; // newer
    const b = timestampToDate(urges[i + 1].timestamp)!; // older
    const gap = a.getTime() - b.getTime();
    if (gap > longestGapMs) longestGapMs = gap;
  }
  const longestStreak = formatDistanceStrict(0, longestGapMs);
  const currentStreak = formatDistanceStrict(0, currentStreakMs);

  // time between last two urges
  const timeBetweenUrges =
    urges.length > 1
      ? formatDistanceStrict(
          timestampToDate(urges[0].timestamp)!,
          timestampToDate(urges[1].timestamp)!
        )
      : 'your first one';

  // 4) reduction vs last 7-day average
  const reductionPercent =
    last7DaysAverage > 0
      ? Math.max(0, ((last7DaysAverage - todaySmokes) / last7DaysAverage) * 100).toFixed(0)
      : '0';

  // 5) cost saved vs baseline
  let costSavedNum = 0;
  const hd = profile.habitDetails || {};
  for (const habit of Object.keys(hd)) {
    const costPer = costsPerItem(hd[habit].packCost, hd[habit].itemsPerPack);
    const baselinePerDay = Number(hd[habit].itemsPerDay ?? 0);
    const smokesThisWeekForHabit = last7DaysUrges
      .filter((u) => u.type === habit)
      .reduce((s, u) => s + (u.count ?? 1), 0);
    const expected = baselinePerDay * 7;
    if (expected > smokesThisWeekForHabit) {
      costSavedNum += (expected - smokesThisWeekForHabit) * costPer;
    }
  }

  // 6) triggers (48h)
  const urges48h = urges.filter(
    (u) => differenceInHours(now, timestampToDate(u.timestamp)!) <= 48
  );
  const triggerCounts: Record<string, number> = {};
  for (const u of urges48h) {
    const key = (u.moodBefore || 'unspecified').trim().toLowerCase();
    triggerCounts[key] = (triggerCounts[key] ?? 0) + 1;
  }
  const mostCommonTrigger =
    Object.keys(triggerCounts).sort(
      (a, b) => (triggerCounts[b] ?? 0) - (triggerCounts[a] ?? 0)
    )[0] || 'nothing specific';

  // 7) replacements (from planned moments log)
  const replacementActivities: string[] = (profile.moments || [])
    .flatMap((m) => Object.values(m.replacementActivity || {}))
    .map((r) => r.activity)
    .filter(Boolean);

  const replacementHabit =
    replacementActivities.length > 0
      ? replacementActivities.sort(
          (a, b) =>
            replacementActivities.filter((x) => x === b).length -
            replacementActivities.filter((x) => x === a).length
        )[0]
      : 'deep breathing';

  // 8) derived extras
  const skippedSmokes = (profile.moments || []).filter(
    (m) => m.completed?.[todayKey] === false
  ).length;

  const minutesSaved =
    skippedSmokes * Number.parseInt(profile.breakDuration || '5', 10);

  const smokeFreeHours = Math.floor(currentStreakMs / (1000 * 60 * 60));

  return {
    // core
    todaySmokes,
    yesterdaySmokes,
    last7DaysTotal,
    last7DaysAverage: Math.round(last7DaysAverage),
    reductionPercent,

    // behaviour
    replacementHabit,
    urgeCount48h: urges48h.length,
    mostCommonTrigger,
    longestStreak,
    currentStreak,
    timeSinceLastSmoke,
    timeBetweenUrges,

    // outcomes
    costSaved: money(costSavedNum, profile.currency),
    healthBenefit:
      'Your carbon monoxide levels are likely back to normal.',

    // user context (soft)
    mood: mostCommonTrigger,
    motivation: profile.motivation || 'your goal',
    goal: profile.goal || 'a smoke-free life',

    // extras for templates (sensible defaults)
    previousPattern: '2', // “every 2 hours”
    previousAverage: Math.round(last7DaysAverage) || 0,
    triggerTime: 'evening',
    previousCount: 5,
    currentCount: 2,
    delayTime: '10 minutes',
    triggerEvent: 'your morning coffee',
    newTrigger: 'scrolling social media',
    emotionTriggerCount: 3,
    routineTriggerCount: 5,
    pattern: 'a mid-day slump',
    skippedSmokes,
    oldGap: '2 hours',
    newGap: '4 hours',
    minutesSaved,
    smokeFreeHours,
    missedSmokes: 10,
    urgeCount: todayUrges.length,
    smokeCount: todayUrges.length,
    slipCount: todaySmokes,
    slipReason: 'a moment of high stress',
    oldDailyAverage: Math.round(last7DaysAverage) || 0,
    moodAfterSlip: 'regretful',
    slipTime: '2:00 PM',
    reason: 'an old habit',
  };
}
