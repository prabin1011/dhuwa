'use client';

import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const useNotifications = () => {
  const { firebaseApp, firestore, user } = useFirebase();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return;
    }

    if (!firebaseApp || !firestore || !user) return;

    const requestPermission = async () => {
      try {
        const messaging = getMessaging(firebaseApp);
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          console.log('Notification permission granted.');
          // Get token
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          });

          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // Save the token to the user's profile
            const userProfileRef = doc(firestore, `users/${user.uid}/profile/main`);
            await updateDoc(userProfileRef, {
              fcmTokens: arrayUnion(currentToken)
            });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (error) {
        console.error('An error occurred while setting up notifications:', error);
      }
    };

    requestPermission();

  }, [firebaseApp, firestore, user]);
};
