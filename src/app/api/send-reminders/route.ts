
'use server';

import { NextResponse } from 'next/headers';
import { initializeAdminApp } from '@/functions';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { notificationTemplates } from '@/lib/notification-templates';
import { differenceInHours, differenceInMinutes, parse } from 'date-fns';

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

// Helper: decide if this request is allowed to run the job
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

export async function POST(req: Request) {
  // IMPORTANT: Only run the security check in production.
  if (process.env.NODE_ENV === 'production' && !isAllowedRequest(req)) {
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
      return NextResponse.json({ message: 'Test check complete. User not found.' }, { status: 200 });
    }

    const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;

    // --- Notification Logic ---
    let notificationToSend: { title: string; body: string; link?: string } | null = null;
    const now = new Date();

    // 1. Check for upcoming planned moments
    const upcomingMoment = userProfile.moments?.find(moment => {
      const momentTime = parse(moment.time, 'HH:mm', now);
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

    // If no moment, check for streaks (simplified for test)
    if (!notificationToSend) {
        const urgesSnapshot = await userRef.collection('urges').orderBy('timestamp', 'desc').limit(1).get();
        const lastUrge = urgesSnapshot.docs[0]?.data() as Urge | undefined;
        const hoursSince = lastUrge ? differenceInHours(now, lastUrge.timestamp.toDate()) : Infinity;

        if (hoursSince >= 24 && hoursSince < 48) {
            notificationToSend = getRandomTemplate(notificationTemplates.streakOneDay);
        } else {
            // Fallback for testing
            notificationToSend = getRandomTemplate(notificationTemplates.randomEncouragement);
        }
    }
    
    if (notificationToSend) {
        await userRef.collection('notifications').add({
            ...notificationToSend,
            timestamp: FieldValue.serverTimestamp(),
            read: false,
        });
        return NextResponse.json({ ok: true, message: `Notification generated: "${notificationToSend.title}"` });
    }

    return NextResponse.json({ ok: true, message: 'Test complete. No new notification was generated based on current conditions.' });

  } catch (error: any) {
    console.error('[send-reminders-post] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
