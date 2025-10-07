
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { addMinutes, isAfter, isBefore, parse } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { notificationTemplates } from '../lib/notification-templates';

if (!getApps().length) {
    try {
        // This is the most robust way for this environment
        const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
        initializeApp({ credential: cert(serviceAccount) });
        console.log('Firebase Admin SDK initialized using service-account.json');
    } catch (e: any) {
        console.error('Failed to initialize Firebase Admin SDK from file:', e.message);
        // Fallback for environment variable, though file is preferred
        try {
            const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountKey) throw new Error('service-account.json not found and FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
            
            const serviceAccount = JSON.parse(serviceAccountKey);
            initializeApp({ credential: cert(serviceAccount) });
            console.log('Firebase Admin SDK initialized using environment variable.');
        } catch (e2: any) {
             console.error('Failed to initialize Firebase Admin SDK from env var:', e2.message);
             throw new Error(`Could not initialize Firebase Admin. Details: ${e2.message}`);
        }
    }
}

const db = getFirestore();
const messaging = getMessaging();

// Helper to get a random template
const getRandomTemplate = (templateArray: {title: string, body: string}[]) => {
    return templateArray[Math.floor(Math.random() * templateArray.length)];
}

export async function sendMomentReminders() {
  const now = new Date();
  const end = addMinutes(now, 15);

  const profiles = await db.collectionGroup('main').get();

  let notificationsSent = 0;
  let errors = 0;

  for (const docSnap of profiles.docs) {
    const p = docSnap.data() as any;
    const userId = docSnap.ref.parent.parent?.id;

    if (!userId || p.reminders !== 'yes') {
      continue; // Skip if no user ID or opted out
    }

    const tokens: string[] = Array.isArray(p.fcmTokens) ? p.fcmTokens : [];
    if (!tokens.length) {
      continue; // Skip if no tokens
    }

    const moments = Array.isArray(p.moments) ? p.moments : [];
    if (!moments.length) {
      continue; // Skip if no planned moments
    }

    const upcoming = moments.filter((m: any) => {
      try {
        const t = parse(m.time, 'HH:mm', now);
        return isAfter(t, now) && isBefore(t, end);
      } catch (error) {
        return false;
      }
    });

    for (const m of upcoming) {
      try {
        const template = getRandomTemplate(notificationTemplates.upcomingMoment);
        const title = template.title.replace('{{time}}', m.time).replace('{{label}}', m.label || 'your moment');
        const body = template.body;

        const notificationPayload = {
            title,
            body,
            timestamp: FieldValue.serverTimestamp(),
            read: false,
            link: '/'
        };

        // 1. Send the push notification
        await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          webpush: { fcmOptions: { link: '/' } },
        });

        // 2. Save the notification to Firestore for history
        await db.collection(`users/${userId}/notifications`).add(notificationPayload);

        notificationsSent++;
      } catch (e) {
        console.error(`Error processing notification for user ${userId}:`, e);
        errors++;
      }
    }
  }

  return { totalUsers: profiles.size, notificationsSent, errors };
}
