
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

        await db.collection(`users/${userId}/notifications`).add(notificationPayload);

        return true;
    } catch (e) {
        console.error(`Error sending notification to user ${userId}:`, e);
        // Here you might want to handle invalid tokens, e.g. remove them from the user's profile
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
        // The `now` date is used as a base for parsing the time string.
        // This creates a Date object for today at the specified moment time.
        const t = parse(m.time, 'HH:mm', now);
        // Check if the moment's time is between now and 15 minutes from now.
        return isAfter(t, now) && isBefore(t, end);
      } catch (error) { 
        console.error(`Invalid time format for moment on user ${userId}: ${m.time}`);
        return false;
      }
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
    // Cooldown: Only send one milestone notification every ~24 hours
    if (lastMilestoneSent && differenceInHours(now, lastMilestoneSent) < 23) {
        return 0; 
    }

    const urgesSnap = await db.collection(`users/${userId}/urges`).orderBy('timestamp', 'desc').limit(1).get();
    if (urgesSnap.empty) return 0; // No urges logged, no milestone to celebrate

    const lastUrgeTimestamp = (urgesSnap.docs[0].data().timestamp as Timestamp).toDate();
    const hoursSinceLastUrge = differenceInHours(now, lastUrgeTimestamp);

    let template: {title: string, body: string} | null = null;
    let milestoneKey: string | null = null;

    // Define milestones from longest to shortest
    const milestones = [
        { hours: 720, key: '30_days', templates: notificationTemplates.streakThirtyDays },
        { hours: 336, key: '14_days', templates: notificationTemplates.streakFourteenDays },
        { hours: 168, key: '7_days', templates: notificationTemplates.streakSevenDays },
        { hours: 48, key: '48_hours', templates: notificationTemplates.streakTwoDays },
        { hours: 24, key: '24_hours', templates: notificationTemplates.streakOneDay },
    ];

    for (const milestone of milestones) {
        if (hoursSinceLastUrge >= milestone.hours) {
            // Check if this specific milestone was already sent
            if (!profile.sentMilestones?.includes(milestone.key)) {
                template = getRandomTemplate(milestone.templates);
                milestoneKey = milestone.key;
                break; // Found the highest applicable, unsent milestone
            }
        }
    }

    if (template && milestoneKey) {
        const success = await sendNotification(userId, tokens, template);
        if (success) {
            await db.doc(`users/${userId}`).update({
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
  const usersSnap = await db.collection('users').where('reminders', '==', 'yes').get();

  if (usersSnap.empty) {
    return { totalUsers: 0, notificationsSent: 0, errors: 0 };
  }

  let notificationsSent = 0;
  let errors = 0;

  for (const docSnap of usersSnap.docs) {
    const profile = docSnap.data() as any;
    const userId = docSnap.id;

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

  return { totalUsers: usersSnap.size, notificationsSent, errors };
}
