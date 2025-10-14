
import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/functions';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { notificationTemplates } from '@/lib/notification-templates';
import { differenceInHours, differenceInMinutes, parse, format, isToday } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UserProfile = {
  id: string;
  username: string;
  email: string;
  fcmTokens?: string[];
  lastNotified?: Record<string, string>;
  moments?: any[];
  reminders?: string;
};

type Urge = {
  id: string;
  timestamp: Timestamp;
  count?: number;
};

// Helper: allow only Vercel Cron or internal requests
function isAllowedRequest(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Vercel Cron Job security: Check for the 'Bearer' token from the injected CRON_SECRET
  if (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // Allow requests from the app's own origin for testing (e.g., "Test Notification" button)
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  if (origin === appUrl || (referer && referer.startsWith(appUrl))) {
    return true;
  }
  
  console.warn('[API Auth] Blocked request. Origin/Referer did not match app URL.', {
      origin,
      referer,
      appUrl
  });

  return false;
}


// Selects a random template from an array
const getRandomTemplate = (templateArray: { title: string; body: string }[]) => {
  return templateArray[Math.floor(Math.random() * templateArray.length)];
};


async function generateNotificationsForUser(userId: string) {
    const { db } = initializeAdminApp();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`User ${userId} not found.`);
      return;
    }

    const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    const lastNotified = userProfile.lastNotified || {};
    const notificationsToAdd: { title: string; body: string; link?: string }[] = [];

    const urgesSnapshot = await userRef.collection('urges').orderBy('timestamp', 'desc').limit(50).get();
    const urges = urgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) as Urge[];

    // --- Logic 1: High-Volume Log ---
    const recentHighLog = urges.find(urge => urge.count && urge.count >= 5 && !lastNotified[`high_log_${urge.id}`]);
    if (recentHighLog) {
        notificationsToAdd.push(getRandomTemplate(notificationTemplates.highVolumeLog));
        await userRef.update({ [`lastNotified.high_log_${recentHighLog.id}`]: todayStr });
    }

    // --- Logic 2: Smoke-Free Streaks ---
    const lastUrgeTime = urges[0]?.timestamp.toDate();
    if (lastUrgeTime) {
        const hoursSince = differenceInHours(now, lastUrgeTime);
        if (hoursSince >= 3 && !lastNotified[`streak_3h_${todayStr}`]) {
             notificationsToAdd.push(getRandomTemplate(notificationTemplates.streakThreeHours));
             await userRef.update({ [`lastNotified.streak_3h_${todayStr}`]: true });
        }
        if (hoursSince >= 8 && !lastNotified[`streak_8h_${todayStr}`]) {
             notificationsToAdd.push(getRandomTemplate(notificationTemplates.streakEightHours));
             await userRef.update({ [`lastNotified.streak_8h_${todayStr}`]: true });
        }
         if (hoursSince >= 24 && !lastNotified[`streak_24h_${todayStr}`]) {
             notificationsToAdd.push(getRandomTemplate(notificationTemplates.streakOneDay));
             await userRef.update({ [`lastNotified.streak_24h_${todayStr}`]: true });
        }
    }
    
    // --- Logic 3: First Replacement ---
    const hasAnyReplacement = userProfile.moments?.some(m => m.replacementActivity && Object.keys(m.replacementActivity).length > 0);
    if (hasAnyReplacement && !lastNotified.first_replacement) {
        notificationsToAdd.push(getRandomTemplate(notificationTemplates.firstReplacement));
        await userRef.update({ 'lastNotified.first_replacement': todayStr });
    }

    // --- Logic 4: Perfect Day on Plan ---
    const yesterdayStr = format(new Date(now.setDate(now.getDate() -1)), 'yyyy-MM-dd');
    const yesterdayMoments = userProfile.moments?.filter(m => m.completed?.[yesterdayStr] !== undefined);
    if (yesterdayMoments && yesterdayMoments.length > 0) {
        const allSkippedOrReplaced = yesterdayMoments.every(m => m.completed[yesterdayStr] === false);
        if (allSkippedOrReplaced && !lastNotified[`perfect_day_${yesterdayStr}`]) {
            notificationsToAdd.push(getRandomTemplate(notificationTemplates.perfectDay));
            await userRef.update({ [`lastNotified.perfect_day_${yesterdayStr}`]: true });
        }
    }


    // --- Batch write all new notifications ---
    if (notificationsToAdd.length > 0) {
        const batch = db.batch();
        notificationsToAdd.forEach(notif => {
            const notifRef = userRef.collection('notifications').doc();
            batch.set(notifRef, {
                ...notif,
                timestamp: FieldValue.serverTimestamp(),
                read: false,
            });
        });
        await batch.commit();
        console.log(`Added ${notificationsToAdd.length} new notifications for user ${userId}.`);
    }
}


export async function POST(req: Request) {
    const vercelEnv = process.env.VERCEL_ENV || 'development';

    // In production, only allow requests from the app's own origin or the cron job
    if (vercelEnv === 'production' && !isAllowedRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  
    const { userId } = await req.json();
    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    try {
        await generateNotificationsForUser(userId);
        return NextResponse.json({ ok: true, message: 'Notification check complete.' });

    } catch (error: any) {
        console.error('[send-reminders-post] error name:', error?.name, 'code:', error?.code);
        console.error('[send-reminders-post] error stack:', error?.stack);
        return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 });
    }
}

// GET handler for Vercel Cron Job
export async function GET(req: Request) {
    // This check ensures only Vercel's cron service can trigger this endpoint
    if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    try {
        // Since we removed cron jobs, this is now a no-op but kept for safety.
        return NextResponse.json({ ok: true, message: 'Cron job endpoint is inactive.' });

    } catch (error: any) {
        console.error('[send-reminders-get] error name:', error?.name, 'code:', error?.code);
        console.error('[send-reminders-get] error stack:', error?.stack);
        return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 });
    }
}
