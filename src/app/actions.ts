'use server';

import * as admin from 'firebase-admin';
import { alanCarrQuotes } from '@/lib/quotes';

// Initialize Firebase Admin SDK if not already initialized
function initializeAdmin() {
    if (admin.apps.length === 0) {
        admin.initializeApp();
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
      return { success: false, message: 'User has no notification tokens. Please grant permission first.' };
    }

    const randomQuote = alanCarrQuotes[Math.floor(Math.random() * alanCarrQuotes.length)];

    const message = {
      notification: {
        title: 'A thought for your journey',
        body: randomQuote,
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

export async function deleteUserAccount(uid: string) {
    initializeAdmin();
    if (!uid) {
        throw new Error('User ID is required to delete an account.');
    }

    try {
        const firestore = admin.firestore();
        const userDocRef = firestore.doc(`users/${uid}`);
        const userProfileRef = firestore.doc(`users/${uid}/profile/main`);
        const urgesCollectionRef = firestore.collection(`users/${uid}/urges`);

        // Delete all documents in the 'urges' subcollection
        const urgesSnapshot = await urgesCollectionRef.get();
        const batch = firestore.batch();
        urgesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the main profile documents
        batch.delete(userProfileRef);
        batch.delete(userDocRef);
        
        await batch.commit();

        // Delete the user from Firebase Authentication
        await admin.auth().deleteUser(uid);

        return { success: true, message: 'Account deleted successfully.' };
    } catch (error) {
        console.error('Error deleting user account:', error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred while deleting the account.' };
    }
}

export async function resetUserData(uid: string) {
    initializeAdmin();
    if (!uid) {
        throw new Error('User ID is required to reset data.');
    }

    try {
        const firestore = admin.firestore();
        const urgesCollectionRef = firestore.collection(`users/${uid}/urges`);
        const snapshot = await urgesCollectionRef.get();

        if (snapshot.empty) {
            return { success: true, message: 'No activity data to clear.' };
        }

        const batch = firestore.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return { success: true, message: 'Your activity data has been reset.' };
    } catch (error) {
        console.error('Error resetting user data:', error);
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred while resetting your data.' };
    }
}
