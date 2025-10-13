
'use server';

import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/functions';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { notificationTemplates } from '@/lib/notification-templates';
import { differenceInHours, differenceInMinutes, parse } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UserProfile = {
  id: string;
  username: string;
  email: string;
  fcmTokens?: string[];
  lastNotified?: Record<string, string>;
  moments?: any[];
};

type Urge = {
  timestamp: Timestamp;
};

// --- Helper: allow only Vercel Cron or internal requests ---
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

async function processUser(userId: string) {
    const { db } = initializeAdminApp();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`User ${userId} not found.`);
      return;
    }

    const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;

    // --- Notification Logic ---
    let notificationToSend: { title: string; body: string; link?: string } | null = null;
    const now = new Date();

    // 1. Check for upcoming planned moments
    const upcomingMoment = userProfile.moments?.find(moment => {
        const momentTime = parse(moment.time, 'HH:mm', now);
        if (isNaN(momentTime.getTime())) return false; // Guard against invalid time strings
        const diff = differenceInMinutes(momentTime, now);
        return diff > 0 && diff <= 15;
    });

    if (upcomingMoment) {
      const template = getRandomTemplate(notificationTemplates.upcomingMoment);
      notificationToSend = {
        title: template.title.replace('{{time}}', upcomingMoment.time).replace('{{label}}', upcomingMoment.label),
        body: template.body,
        link: '/dashboard#plan'
      };
    }

    // 2. If no moment, check for streaks
    if (!notificationToSend) {
        const urgesSnapshot = await userRef.collection('urges').orderBy('timestamp', 'desc').limit(1).get();
        const lastUrge = urgesSnapshot.docs[0]?.data() as Urge | undefined;
        const hoursSince = lastUrge ? differenceInHours(now, lastUrge.timestamp.toDate()) : Infinity;

        // Check milestones, ensuring we don't notify for the same one twice in a day
        const todayStr = now.toISOString().split('T')[0];
        const lastNotifiedStreak = userProfile.lastNotified?.streak;
        
        if (hoursSince >= (30 * 24) && lastNotifiedStreak !== `30-day-${todayStr}`) {
            notificationToSend = getRandomTemplate(notificationTemplates.streakThirtyDays);
            await userRef.update({ 'lastNotified.streak': `30-day-${todayStr}` });
        } else if (hoursSince >= (14 * 24) && lastNotifiedStreak !== `14-day-${todayStr}`) {
            notificationToSend = getRandomTemplate(notificationTemplates.streakFourteenDays);
            await userRef.update({ 'lastNotified.streak': `14-day-${todayStr}` });
        } else if (hoursSince >= (7 * 24) && lastNotifiedStreak !== `7-day-${todayStr}`) {
            notificationToSend = getRandomTemplate(notificationTemplates.streakSevenDays);
            await userRef.update({ 'lastNotified.streak': `7-day-${todayStr}` });
        } else if (hoursSince >= 48 && lastNotifiedStreak !== `2-day-${todayStr}`) {
            notificationToSend = getRandomTemplate(notificationTemplates.streakTwoDays);
            await userRef.update({ 'lastNotified.streak': `2-day-${todayStr}` });
        } else if (hoursSince >= 24 && lastNotifiedStreak !== `1-day-${todayStr}`) {
            notificationToSend = getRandomTemplate(notificationTemplates.streakOneDay);
            await userRef.update({ 'lastNotified.streak': `1-day-${todayStr}` });
        }
    }
    
    // 3. Fallback to general encouragement if no other notification was sent
     if (!notificationToSend) {
        const lastEncouragementStr = userProfile.lastNotified?.encouragement;
        if (!lastEncouragementStr || differenceInHours(now, new Date(lastEncouragementStr)) > 6) {
             notificationToSend = getRandomTemplate(notificationTemplates.randomEncouragement);
             await userRef.update({ 'lastNotified.encouragement': now.toISOString() });
        }
    }
    
    if (notificationToSend) {
        await userRef.collection('notifications').add({
            ...notificationToSend,
            timestamp: FieldValue.serverTimestamp(),
            read: false,
        });
        console.log(`Notification generated for ${userId}: "${notificationToSend.title}"`);
    }
}


export async function GET(req: Request) {
    // In production, only allow cron jobs. In dev, allow any request for testing.
    const vercelEnv = process.env.VERCEL_ENV || 'development';
    if (vercelEnv === 'production' && !isAllowedRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    try {
        const { db } = initializeAdminApp();
        const usersSnapshot = await db.collection('users').where('reminders', '==', 'yes').get();
        
        if (usersSnapshot.empty) {
            return NextResponse.json({ ok: true, message: 'No users with reminders enabled.' });
        }

        const processingPromises = usersSnapshot.docs.map(doc => processUser(doc.id));
        await Promise.all(processingPromises);

        return NextResponse.json({ ok: true, message: `Processed reminders for ${usersSnapshot.size} users.` });

    } catch (error: any) {
        console.error('[send-reminders-get] error:', error);
        return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 });
    }
}
