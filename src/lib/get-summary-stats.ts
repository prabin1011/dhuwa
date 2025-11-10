import {
    format,
    isToday,
    isYesterday,
    subDays,
    differenceInHours,
    differenceInMinutes,
    formatDistanceStrict,
} from 'date-fns';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';

// --- TYPE DEFINITIONS ---
interface Urge {
    timestamp: Timestamp;
    moodBefore?: string;
    count?: number;
    type?: string;
}

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, { activity: string; mood?: string; }>;
}

interface UserProfile {
    goal?: string;
    motivation?: string;
    habitDetails?: Record<string, { packCost?: number; itemsPerPack?: number; itemsPerDay?: string | number }>;
    moments?: SmokingMoment[];
    currency?: string;
    breakDuration?: string;
}

export interface SummaryStats {
    todaySmokes: number;
    yesterdaySmokes: number;
    last7DaysSmokes: number;
    reductionPercent: string;
    replacementHabit: string;
    urgeCount48h: number;
    mostCommonTrigger: string;
    longestStreak: string;
    currentStreak: string;
    timeSinceLastSmoke: string;
    timeBetweenUrges: string;
    costSaved: string;
    healthBenefit: string;
    mood: string;
    motivation: string;
    goal: string;
    // For trigger templates
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
    // For progress templates
    previousAverage?: number;
    skippedSmokes?: number;
    oldGap?: string;
    newGap?: string;
    minutesSaved?: number;
    smokeFreeHours?: number;
    missedSmokes?: number;
    urgeCount?: number;
    smokeCount?: number;
    // For recovery templates
    slipCount?: number;
    slipReason?: string;
    oldDailyAverage?: number;
    moodAfterSlip?: string;
    slipTime?: string;
    reason?: string;
    [key: string]: string | number | undefined;
}


// --- HELPER FUNCTIONS ---

const getUrgesOnDate = (urges: WithId<Urge>[], date: Date) =>
    urges.filter(u => u.timestamp && format(u.timestamp.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

const countSmokes = (urges: WithId<Urge>[]) =>
    urges.reduce((sum, u) => sum + (u.count || 1), 0);

const getCostPerItem = (profile: UserProfile, habit: string) => {
    const details = profile.habitDetails?.[habit];
    if (!details || !details.packCost || !details.itemsPerPack) return 0;
    return Number(details.packCost) / Number(details.itemsPerPack);
};

const formatMoney = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

// --- MAIN FUNCTION ---

export function getSummaryStats(urges: WithId<Urge>[], profile: UserProfile): SummaryStats {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Basic Counts
    const todayUrges = getUrgesOnDate(urges, now);
    const yesterdayUrges = getUrgesOnDate(urges, yesterday);
    const last7DaysUrges = urges.filter(u => u.timestamp && u.timestamp.toDate() > sevenDaysAgo);
    
    const todaySmokes = countSmokes(todayUrges);
    const yesterdaySmokes = countSmokes(yesterdayUrges);
    const last7DaysSmokes = countSmokes(last7DaysUrges);
    const avgLast7Days = last7DaysSmokes / 7;
    
    // Streaks
    const timeSinceLastSmoke = urges.length > 0
        ? formatDistanceStrict(urges[0].timestamp.toDate(), now)
        : 'the beginning';
    
    let longestStreakMs = 0;
    let currentStreakMs = urges.length > 0 ? now.getTime() - urges[0].timestamp.toDate().getTime() : now.getTime() - (profile.moments?.[0]?.date?.getTime() || now.getTime());

    for (let i = 0; i < urges.length - 1; i++) {
        const diff = urges[i].timestamp.toDate().getTime() - urges[i+1].timestamp.toDate().getTime();
        if (diff > longestStreakMs) {
            longestStreakMs = diff;
        }
    }
    const longestStreak = formatDistanceStrict(new Date(0), new Date(longestStreakMs));
    const currentStreak = formatDistanceStrict(new Date(0), new Date(currentStreakMs));

    // Reduction Percentage
    const reductionPercent = avgLast7Days > 0
        ? (((avgLast7Days - todaySmokes) / avgLast7Days) * 100).toFixed(0)
        : '0';

    // Cost Saved
    let costSaved = 0;
    const habitDetails = profile.habitDetails || {};
    for (const habit in habitDetails) {
        const costPer = getCostPerItem(profile, habit);
        const baselinePerDay = parseFloat(String(habitDetails[habit].itemsPerDay) || '0');
        const smokesThisWeek = last7DaysUrges.filter(u => u.type === habit).reduce((sum, u) => sum + (u.count || 1), 0);
        const expectedSmokes = baselinePerDay * 7;
        if (expectedSmokes > smokesThisWeek) {
            costSaved += (expectedSmokes - smokesThisWeek) * costPer;
        }
    }

    // Triggers
    const triggerCounts: Record<string, number> = {};
    const urges48h = urges.filter(u => u.timestamp && differenceInHours(now, u.timestamp.toDate()) <= 48);
    urges48h.forEach(u => {
        if (u.moodBefore) {
            triggerCounts[u.moodBefore] = (triggerCounts[u.moodBefore] || 0) + 1;
        }
    });
    const mostCommonTrigger = Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b, 'nothing specific');
    
    // Replacements
    const replacementActivities = (profile.moments || [])
        .flatMap(m => Object.values(m.replacementActivity || {}))
        .map(r => r.activity);
    const mostCommonReplacement = replacementActivities.length > 0 
        ? replacementActivities.reduce((a,b,i,arr)=>
            (arr.filter(v=>v===a).length>=arr.filter(v=>v===b).length?a:b), replacementActivities[0])
        : 'deep breathing';


    return {
        todaySmokes,
        yesterdaySmokes,
        last7DaysSmokes: Math.round(avgLast7Days),
        reductionPercent,
        replacementHabit: mostCommonReplacement,
        urgeCount48h: urges48h.length,
        mostCommonTrigger,
        longestStreak,
        currentStreak,
        timeSinceLastSmoke,
        timeBetweenUrges: urges.length > 1 ? formatDistanceStrict(urges[0].timestamp.toDate(), urges[1].timestamp.toDate()) : 'your first one',
        costSaved: formatMoney(costSaved, profile.currency),
        healthBenefit: "Your carbon monoxide levels are likely back to normal.",
        mood: mostCommonTrigger,
        motivation: profile.motivation || 'your goal',
        goal: profile.goal || 'a smoke-free life',

        // Default values for other template placeholders
        previousPattern: '2', // As in 'every 2 hours'
        previousAverage: Math.round(avgLast7Days),
        triggerTime: "the evening",
        previousCount: 5,
        currentCount: 2,
        delayTime: "10 minutes",
        triggerEvent: "your morning coffee",
        newTrigger: "scrolling social media",
        emotionTriggerCount: 3,
        routineTriggerCount: 5,
        pattern: "a mid-day slump",
        skippedSmokes: (profile.moments || []).filter(m => m.completed?.[today] === false).length,
        oldGap: "2 hours",
        newGap: "4 hours",
        minutesSaved: (profile.moments || []).filter(m => m.completed?.[today] === false).length * (parseInt(profile.breakDuration || '5', 10)),
        smokeFreeHours: Math.floor(currentStreakMs / (1000 * 60 * 60)),
        missedSmokes: 10,
        urgeCount: todayUrges.length,
        smokeCount: todayUrges.length,
        slipCount: todaySmokes,
        slipReason: "a moment of high stress",
        oldDailyAverage: Math.round(avgLast7Days),
        moodAfterSlip: "regretful",
        slipTime: "2:00 PM",
        reason: "an old habit",
    };
}
