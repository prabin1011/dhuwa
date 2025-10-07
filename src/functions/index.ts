
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { addMinutes, isAfter, isBefore, parse } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { notificationTemplates } from '../lib/notification-templates';

if (!getApps().length) {
    try {
        const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            initializeApp({ credential: cert(serviceAccount) });
            console.log('Firebase Admin SDK initialized using service-account.json');
        } else {
            throw new Error('service-account.json not found.');
        }
    } catch (e: any) {
        console.error('Failed to initialize Firebase Admin SDK from file:', e.message);
        throw new Error(`Could not initialize Firebase Admin. Details: ${e.message}`);
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

    if (p.reminders !== 'yes') {
      continue; // Skip user if they've opted out
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

        await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          webpush: { fcmOptions: { link: '/' } },
        });
        notificationsSent++;
      } catch (e) {
        console.error(`Error sending notification for user ${docSnap.id}:`, e);
        errors++;
      }
    }
  }

  return { totalUsers: profiles.size, notificationsSent, errors };
}
