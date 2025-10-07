
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { notificationTemplates } from '@/lib/notification-templates';
import { isAfter, isBefore, parse, addMinutes } from 'date-fns';

if (!getApps().length) {
    // IMPORTANT: The `cert` function part requires you to set up a service account
    // in your Google Cloud project and download the JSON key.
    // This key must be stored securely, e.g., in an environment variable.
    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const db = getFirestore();
const messaging = getMessaging();

/**
 * Sends notifications to users with planned smoking moments in the near future.
 */
export async function sendMomentReminders() {
    const now = new Date();
    const notificationWindowEnd = addMinutes(now, 15); // e.g., check for moments in the next 15 mins

    // 1. Get all user profiles
    const profilesSnapshot = await db.collectionGroup('main').get();

    const results = {
        totalUsers: profilesSnapshot.size,
        notificationsSent: 0,
        errors: 0,
    };

    // 2. Iterate through each user
    for (const profileDoc of profilesSnapshot.docs) {
        const profile = profileDoc.data();
        const fcmTokens = profile.fcmTokens;
        
        // --- NEW: Check for consent ---
        if (profile.reminders !== 'yes') {
            continue; // Skip users who have not opted in
        }

        if (!fcmTokens || !Array.isArray(fcmTokens) || fcmTokens.length === 0) {
            continue; // Skip users with no tokens
        }

        // 3. Check for upcoming moments
        const upcomingMoments = (profile.moments || []).filter((moment: any) => {
            try {
                const momentTime = parse(moment.time, 'HH:mm', now);
                // Check if the moment is within our notification window
                return isAfter(momentTime, now) && isBefore(momentTime, notificationWindowEnd);
            } catch {
                return false;
            }
        });

        // 4. Send notifications for each upcoming moment
        for (const moment of upcomingMoments) {
            const [template] = notificationTemplates.upcomingMoment;
            const message = {
                tokens: fcmTokens,
                notification: {
                    title: template.title.replace('{{time}}', moment.time).replace('{{label}}', moment.label),
                    body: template.body,
                },
                webpush: {
                    fcmOptions: {
                        link: '/',
                    },
                },
            };

            try {
                await messaging.sendEachForMulticast(message);
                results.notificationsSent += 1;
            } catch (error) {
                console.error('Failed to send notification:', error);
                results.errors += 1;
            }
        }
    }
    return results;
}
