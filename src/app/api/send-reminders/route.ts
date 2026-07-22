
import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/functions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { notificationTemplates } from '@/lib/notification-templates';
import { differenceInHours, format } from 'date-fns';
import { canSendNotification } from '@/lib/notify-guard';
import { renderTemplate as renderTemplateInternal } from '@/lib/render-template';
import { timestampToDate } from '@/lib/timestamp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const vercelEnv =
  process.env.VERCEL_ENV || (process.env.NODE_ENV === 'development' ? 'development' : 'production');
const isProd = vercelEnv === 'production';
const MIN_SERVER_COOLDOWN_MIN = Number(process.env.INSIGHTS_COOLDOWN_MINUTES ?? 240);


function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// tiny template helper for {{vars}}
function renderTemplate(
  tpl: { title: string; body: string; link?: string },
  vars: Record<string, string | number | undefined> = {}
) {
  return {
    title: renderTemplateInternal(tpl.title, vars),
    body: renderTemplateInternal(tpl.body, vars),
    link: tpl.link ? renderTemplateInternal(tpl.link, vars) : undefined,
  };
}

// cap how many insights we create per click
const MAX_NOTIFS_PER_CHECK = 4;

type UserProfile = {
  id: string;
  username?: string;
  email?: string;
  fcmTokens?: string[];
  lastNotified?: Record<string, any>;
  moments?: Array<{
    id: string;
    label?: string;
    time?: string; // 'HH:mm'
    completed?: Record<string, boolean>;
    replacementActivity?: Record<string, string>;
  }>;
  reminders?: string;
  meta?: { // For notify guard
      lastNotifAt?: number;
      lastNotifHash?: string;
  }
};

type Urge = {
  id: string;
  timestamp: Timestamp;
  count?: number;
  type?: string;
};

// Helper: allow only Vercel Cron or internal requests
function isAllowedRequest(req: Request): boolean {
  // Allow cron jobs with the correct secret
  if (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  
  // Allow same-origin requests from the app's frontend (most reliable)
  if (req.headers.get('sec-fetch-site') === 'same-origin') {
    return true;
  }

  // Fallback for older browsers or different environments, check origin/referer
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  if (appUrl) {
    if (origin === appUrl || (referer && referer.startsWith(appUrl))) {
      return true;
    }
  }

  console.warn('[API Auth] Blocked request. Headers did not match.', {
      'sec-fetch-site': req.headers.get('sec-fetch-site'),
      origin,
      referer,
      appUrl
  });

  return false;
}

async function generateNotificationsForUser(userId: string, userProfile: UserProfile) {
  const { db } = initializeAdminApp();
  const userRef = db.collection('users').doc(userId);

  const lastNotified = userProfile.lastNotified || {};
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  // safe “yesterday” (don’t mutate `now`)
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterdayStr = format(y, 'yyyy-MM-dd');

  // recent urges
  const urgesSnapshot = await userRef.collection('urges').orderBy('timestamp', 'desc').limit(50).get();
  const urges = urgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) as Urge[];

  // queue we’ll batch-write
  const toCreate: Array<{ key: string; title: string; body: string; link?: string; rule: string, hash: string }> = [];
  const lastNotifiedUpdates: Record<string, any> = {};
  const add = (
    rule: string,
    key: string,
    group: { title: string; body: string; link?: string }[],
    vars: Record<string, string | number | undefined> = {}
  ) => {
    if (toCreate.length >= MAX_NOTIFS_PER_CHECK) return;
    const tpl = pick(group);
    const rendered = renderTemplate(tpl, { name: userProfile.username, ...vars });

    const guard = canSendNotification({
      lastSentAt: userProfile.meta?.lastNotifAt,
      minCooldownMin: 90, // 90 min cooldown
      lastContentHash: userProfile.meta?.lastNotifHash,
      nextContent: rendered.body,
    });
    
    if (guard.ok && 'hash' in guard) {
        const hash = guard.hash ?? rendered.body;
        toCreate.push({ key, rule, ...rendered, hash });
        lastNotifiedUpdates[`lastNotified.${key}`] = true;
        lastNotifiedUpdates['meta.lastNotifAt'] = Date.now();
        lastNotifiedUpdates['meta.lastNotifHash'] = hash;
    }
  };

  // --- Rule 1: High-volume log (>= 5 in one entry)
  const spike = urges.find(u => (u.count ?? 1) >= 5);
  if (spike) {
    const key = `high_log_${spike.id}`;
    if (!lastNotified[key]) add('high_volume', key, notificationTemplates.highVolumeLog, { count: spike.count ?? 5 });
  }

  // --- Rule 2: Streaks since last urge (3h/8h/24h) — only once per day per tier
  const lastUrge = urges[0];
  const lastUrgeDate = timestampToDate(lastUrge?.timestamp);
  if (lastUrgeDate) {
    const hours = differenceInHours(now, lastUrgeDate);
    if (hours >= 3 && !lastNotified[`streak_3h_${todayStr}`]) add('streak_3h', `streak_3h_${todayStr}`, notificationTemplates.streakThreeHours, { hours: 3 });
    if (hours >= 8 && !lastNotified[`streak_8h_${todayStr}`]) add('streak_8h', `streak_8h_${todayStr}`, notificationTemplates.streakEightHours, { hours: 8 });
    if (hours >= 24 && !lastNotified[`streak_24h_${todayStr}`]) add('streak_24h', `streak_24h_${todayStr}`, notificationTemplates.streakOneDay, { hours: 24 });
  }

  // --- Rule 3: First replacement ever
  const hasReplacement = (userProfile.moments || []).some(m => m.replacementActivity && Object.keys(m.replacementActivity).length > 0);
  if (hasReplacement && !lastNotified.first_replacement) add('first_replacement', 'first_replacement', notificationTemplates.firstReplacement);

  // --- Rule 4: Perfect yesterday on plan (all planned completed[yesterday] === false)
  const plannedYesterday = (userProfile.moments || []).filter(m => m.completed && yesterdayStr in m.completed);
  if (plannedYesterday.length > 0) {
    const perfect = plannedYesterday.every(m => m.completed?.[yesterdayStr] === false);
    const key = `perfect_day_${yesterdayStr}`;
    if (perfect && !lastNotified[key]) add('perfect_day', key, notificationTemplates.perfectDay);
  }

  // --- Rule 5: Morning pattern today (>=2 urges before 9am)
  const morningCount = urges.filter(u => {
    const dt = timestampToDate(u.timestamp);
    return dt && format(dt, 'yyyy-MM-dd') === todayStr && dt.getHours() < 9;
  }).length;
  if (morningCount >= 2) {
    const key = `morning_pattern_${todayStr}`;
    if (!lastNotified[key]) add('morning_pattern', key, notificationTemplates.morningPattern, { count: morningCount });
  }

  // --- Rule 6: Weekly reflection (once per ISO week)
  const weekKey = `weekly_${format(now, "yyyy-'W'ww")}`;
  if (!lastNotified[weekKey]) {
    // compute quick weekly stats from the same 50-doc window
    const buckets = new Array(24).fill(0);
    let total = 0;
    const weekId = format(now, "yyyy-'W'ww");
    urges.forEach(u => {
      const dt = timestampToDate(u.timestamp);
      if (!dt) return;
      if (format(dt, "yyyy-'W'ww") === weekId) {
        total += u.count ?? 1;
        buckets[dt.getHours()] += u.count ?? 1;
      }
    });
    // best 3-hour window
    let bestStart = 0, bestSum = -1;
    for (let i = 0; i < 24; i++) {
      const s = buckets[i] + buckets[(i + 1) % 24] + buckets[(i + 2) % 24];
      if (s > bestSum) { bestSum = s; bestStart = i; }
    }
    const fmt = (h: number) => `${(h % 12) || 12} ${h >= 12 ? 'PM' : 'AM'}`;
    add('weekly', weekKey, notificationTemplates.weekly, { total, window: `${fmt(bestStart)}–${fmt((bestStart + 2) % 24)}` });
  }

  // Always update the server-side cooldown timestamp, even if no new insights are created
  lastNotifiedUpdates['lastNotified.lastInsightCheckAt'] = new Date().toISOString();

  if (toCreate.length === 0) {
    // If no new notifications, just update the timestamp
    await userRef.update(lastNotifiedUpdates);
    return { created: 0 };
  }

  // --- Atomic batch write: notifications + lastNotified flags together
  const batch = db.batch();
  toCreate.forEach(n => {
    const ref = userRef.collection('notifications').doc();
    batch.set(ref, {
      title: n.title,
      body: n.body,
      link: n.link ?? null,
      rule: n.rule,
      key: n.key,
      read: false,
      timestamp: FieldValue.serverTimestamp(),
    });
  });

  if (Object.keys(lastNotifiedUpdates).length) {
    batch.update(userRef, lastNotifiedUpdates);
  }
  await batch.commit();

  return { created: toCreate.length, keys: toCreate.map(n => n.key) };
}


export async function POST(req: Request) {
    if (isProd && !isAllowedRequest(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  
    const { userId } = await req.json();
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    try {
        const { db } = initializeAdminApp();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          return NextResponse.json({ ok: true, message: 'User not found.' });
        }

        const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
        const meta = userProfile.lastNotified || {};
        const lastCheckIso = meta.lastInsightCheckAt as string | undefined;

        if (lastCheckIso) {
            const deltaMin = (Date.now() - new Date(lastCheckIso).getTime()) / (60 * 1000);
            if (deltaMin < MIN_SERVER_COOLDOWN_MIN) {
                const retryAfterSec = Math.max(1, Math.floor((MIN_SERVER_COOLDOWN_MIN - deltaMin) * 60));
                
                // Keep profile in sync even on skip
                await userRef.update({ 'lastNotified.lastInsightCheckAt': new Date().toISOString() });

                return new NextResponse(
                    JSON.stringify({
                        ok: true,
                        skipped: true,
                        message: `Server cooldown active. Try again in ${Math.ceil(
                            MIN_SERVER_COOLDOWN_MIN - deltaMin
                        )} min.`,
                        retryAfterSeconds: retryAfterSec,
                        nextAllowedAt: new Date(Date.now() + retryAfterSec * 1000).toISOString(),
                    }),
                    {
                        status: 200,
                        headers: {
                            'Retry-After': String(retryAfterSec),
                            'Content-Type': 'application/json',
                        },
                    }
                );
            }
        }
        
        const result = await generateNotificationsForUser(userId, userProfile);
        return NextResponse.json({ ok: true, ...result });

    } catch (error: any) {
        console.error('[send-reminders-post] error name:', error?.name, 'code:', error?.code);
        console.error('[send-reminders-post] error stack:', error?.stack);
        return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 });
    }
}

    
