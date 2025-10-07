
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { addMinutes, isAfter, isBefore, parse } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

if (!getApps().length) {
    try {
        let serviceAccount;
        // First, try the environment variable (primary method)
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } else {
            // Fallback for local development: check for a file
            const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
            if (fs.existsSync(serviceAccountPath)) {
                console.log('Found service-account.json, using for local dev.');
                serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            } else {
                 throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable and no service-account.json found.');
            }
        }
        initializeApp({ credential: cert(serviceAccount) });

    } catch (e: any) {
        console.error('Failed to initialize Firebase Admin SDK:', e.message);
        // Throw a more specific error to help debugging
        throw new Error(`Could not initialize Firebase Admin. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is a valid, single-line JSON string. Details: ${e.message}`);
    }
}


const db = getFirestore();
const messaging = getMessaging();

export async function sendMomentReminders() {
  const now = new Date();
  const end = addMinutes(now, 15);

  const profiles = await db.collectionGroup('main').get();

  let notificationsSent = 0;
  let errors = 0;

  for (const docSnap of profiles.docs) {
    const p = docSnap.data() as any;

    // ✅ consent gate
    if (p.reminders !== 'yes') {
      console.log(`User ${docSnap.id} did not opt-in for reminders. Skipping...`);
      continue;
    }

    const tokens: string[] = Array.isArray(p.fcmTokens) ? p.fcmTokens : [];
    if (!tokens.length) {
      console.log(`User ${docSnap.id} does not have any FCM tokens. Skipping...`);
      continue;
    }

    const moments = Array.isArray(p.moments) ? p.moments : [];
    if (!moments.length) {
      console.log(`User ${docSnap.id} has no planned moments. Skipping...`);
      continue;
    }

    const upcoming = moments.filter((m: any) => {
      try {
        const t = parse(m.time, 'HH:mm', now);
        return isAfter(t, now) && isBefore(t, end);
      } catch (error) {
        console.log(`Error parsing moment time for user ${docSnap.id}:`, m.time, error);
        return false;
      }
    });

    for (const m of upcoming) {
      try {
        await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: `Coming up ${m.time}: ${m.label || 'planned moment'}`,
            body: 'Try a replacement you picked instead.',
          },
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
