
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { addMinutes, isAfter, isBefore, parse, differenceInHours } from 'date-fns';
import { notificationTemplates } from '../lib/notification-templates';

// Simplified initialization for Vercel environment
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
            Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS || '', 'base64').toString('utf-8')
        );
        initializeApp({ credential: cert(serviceAccount) });
        console.log('Firebase Admin SDK initialized.');
    } catch (e: any) {
        console.error('Failed to initialize Firebase Admin SDK:', e.message);
        throw new Error(`Could not initialize Firebase Admin. Details: ${e.message}`);
    }
}


const db = getFirestore();
const messaging = getMessaging();

const getRandomTemplate = (templateArray: {title: string, body: string}[]) => {
    if (!templateArray || templateArray.length === 0) {
        return { title: "Keep Going!", body: "You're on the right track." };
    }
    return templateArray[Math.floor(Math.random() * templateArray.length)];
}

const sendNotification = async (userId: string, tokens: string[], template: {title: string, body: string}) => {
    if (!tokens || tokens.length === 0) return false;
    try {
        const notificationPayload = {
            title: template.title,
            body: template.body,
            timestamp: FieldValue.serverTimestamp(),
            read: false,
            link: '/'
        };
        
        await messaging.sendEachForMulticast({
          tokens,
          notification: { title: template.title, body: template.body },
          webpush: { fcmOptions: { link: '/' } },
        });

        // FIX: Actually save the notification to the user's history
        await db.collection(`users/${userId}/notifications`).add(notificationPayload);

        return true;
    } catch (e) {
        console.error(`Error sending notification to user ${userId}:`, e);
        return false;
    }
}

const handleUpcomingMomentReminders = async (userId: string, profile: any, tokens: string[], now: Date) => {
    let sentCount = 0;
    const end = addMinutes(now, 15);
    const moments = Array.isArray(profile.moments) ? profile.moments : [];
    if (!moments.length) return sentCount;

    const upcoming = moments.filter((m: any) => {
      try {
        if (!m.time) return false;
        const t = parse(m.time, 'HH:mm', now);
        return isAfter(t, now) && isBefore(t, end);
      } catch (error) { return false; }
    });

    for (const m of upcoming) {
      const template = getRandomTemplate(notificationTemplates.upcomingMoment);
      const title = template.title.replace('{{time}}', m.time).replace('{{label}}', m.label || 'your moment');
      const success = await sendNotification(userId, tokens, { title, body: template.body });
      if (success) sentCount++;
    }
    return sentCount;
}

const handleMilestoneNotifications = async (userId: string, profile: any, tokens: string[], now: Date) => {
    const lastMilestoneSent = profile.lastMilestoneNotificationSent?.toDate();
    if (lastMilestoneSent && differenceInHours(now, lastMilestoneSent) < 23) {
        return 0; // Cooldown: Only send once every ~24 hours
    }

    const urgesSnap = await db.collection(`users/${userId}/urges`).orderBy('timestamp', 'desc').limit(1).get();
    if (urgesSnap.empty) return 0; // No urges logged, no milestone to celebrate

    const lastUrgeTimestamp = (urgesSnap.docs[0].data().timestamp as Timestamp).toDate();
    const hoursSinceLastUrge = differenceInHours(now, lastUrgeTimestamp);

    let template: {title: string, body: string} | null = null;
    let milestoneKey: string | null = null;

    if (hoursSinceLastUrge >= 720) { // 30 days
        template = getRandomTemplate(notificationTemplates.streakThirtyDays);
        milestoneKey = '30_days';
    } else if (hoursSinceLastUrge >= 336) { // 14 days
        template = getRandomTemplate(notificationTemplates.streakFourteenDays);
        milestoneKey = '14_days';
    } else if (hoursSinceLastUrge >= 168) { // 7 days
        template = getRandomTemplate(notificationTemplates.streakSevenDays);
        milestoneKey = '7_days';
    } else if (hoursSinceLastUrge >= 48) {
        template = getRandomTemplate(notificationTemplates.streakTwoDays);
         milestoneKey = '48_hours';
    } else if (hoursSinceLastUrge >= 24) {
        template = getRandomTemplate(notificationTemplates.streakOneDay);
         milestoneKey = '24_hours';
    }

    // Check if this specific milestone was already sent
    if (milestoneKey && profile.sentMilestones?.includes(milestoneKey)) {
        return 0;
    }

    if (template && milestoneKey) {
        const success = await sendNotification(userId, tokens, template);
        if (success) {
            await db.doc(`users/${userId}/profile/main`).update({
                lastMilestoneNotificationSent: FieldValue.serverTimestamp(),
                sentMilestones: FieldValue.arrayUnion(milestoneKey) // Record that this milestone was sent
            });
            return 1;
        }
    }
    return 0;
};


export async function sendMomentReminders() {
  const now = new Date();
  const profiles = await db.collectionGroup('main').get();

  let notificationsSent = 0;
  let errors = 0;

  for (const docSnap of profiles.docs) {
    const profile = docSnap.data() as any;
    const userId = docSnap.ref.parent.parent?.id;

    if (!userId || profile.reminders !== 'yes') continue;

    const tokens: string[] = Array.isArray(profile.fcmTokens) ? profile.fcmTokens : [];
    if (!tokens.length) continue;

    try {
        const momentReminders = await handleUpcomingMomentReminders(userId, profile, tokens, now);
        notificationsSent += momentReminders;

        const milestoneReminders = await handleMilestoneNotifications(userId, profile, tokens, now);
        notificationsSent += milestoneReminders;

    } catch(e) {
        console.error(`Error processing notifications for user ${userId}:`, e);
        errors++;
    }
  }

  return { totalUsers: profiles.size, notificationsSent, errors };
}
