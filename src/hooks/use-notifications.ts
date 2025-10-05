'use client';

import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// This function now just registers the static service worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // The path is now relative to the root of the site.
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/' 
            });
            console.log('Service Worker registration successful with scope: ', registration.scope);
            return registration;
        } catch (err) {
            console.error('Service Worker registration failed: ', err);
            return null;
        }
    }
    console.warn('Service workers are not supported in this browser.');
    return null;
}


export const useNotifications = () => {
  const { firebaseApp, firestore, user } = useFirebase();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return;
    }

    if (!firebaseApp || !firestore || !user) return;

    const requestPermissionAndToken = async () => {
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

    // Register SW and then get token
    registerServiceWorker().then(registration => {
      if (registration) {
        requestPermissionAndToken();
      }
    });

  }, [firebaseApp, firestore, user]);
};
