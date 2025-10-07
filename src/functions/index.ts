
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { addMinutes, isAfter, isBefore, parse } from 'date-fns';

if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY');
    initializeApp({ credential: cert(JSON.parse(raw)) });
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
    if (p.reminders !== 'yes') continue;

    const tokens: string[] = Array.isArray(p.fcmTokens) ? p.fcmTokens : [];
    if (!tokens.length) continue;

    const moments = Array.isArray(p.moments) ? p.moments : [];
    const upcoming = moments.filter((m: any) => {
      try {
        const t = parse(m.time, 'HH:mm', now);
        return isAfter(t, now) && isBefore(t, end);
      } catch { return false; }
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
        console.error('send error', e);
        errors++;
      }
    }
  }

  return { totalUsers: profiles.size, notificationsSent, errors };
}
