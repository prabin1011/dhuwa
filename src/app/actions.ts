'use server';

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
function initializeAdmin() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
}


export async function sendTestNotification(uid: string) {
  initializeAdmin();

  if (!uid) {
    throw new Error('User ID is required to send a notification.');
  }

  try {
    const firestore = admin.firestore();
    const userProfileRef = firestore.doc(`users/${uid}/profile/main`);
    const userProfileSnap = await userProfileRef.get();

    if (!userProfileSnap.exists) {
      throw new Error('User profile does not exist.');
    }

    const userProfile = userProfileSnap.data();
    const tokens = userProfile?.fcmTokens;

    if (!tokens || tokens.length === 0) {
      console.log('User does not have any FCM tokens.');
      return { success: false, message: 'User has no notification tokens.' };
    }

    const message = {
      notification: {
        title: 'Hello from your AI Coach!',
        body: 'This is a test notification to confirm everything is working.',
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log('Successfully sent message:', response);
    
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('List of tokens that caused failures: ' + failedTokens);
    }

    return { success: true, message: `Notification sent to ${response.successCount} device(s).` };
  } catch (error) {
    console.error('Error sending notification:', error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}
