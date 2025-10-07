
'use client';

import { useEffect, useCallback, useState } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from './use-toast';

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Unregister any existing service workers to ensure the new one takes over.
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log('Old service worker unregistered.');
            }
            
            // Register the new service worker
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
  const { toast } = useToast();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermissionAndToken = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        toast({ variant: 'destructive', title: 'Unsupported', description: 'This browser does not support notifications.' });
        return null;
    }
    if (!firebaseApp || !firestore || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot set up notifications without being logged in.' });
        return null;
    }
    
    // Ensure the service worker is registered before requesting a token
    const swRegistration = await registerServiceWorker();
    if (!swRegistration) {
        toast({ variant: 'destructive', title: 'Setup Failed', description: 'Could not register the notification service worker.' });
        return;
    }
    
    if (!process.env.NEXT_PUBLIC_VAPID_KEY) {
        console.error("VAPID key is missing. Set NEXT_PUBLIC_VAPID_KEY in your .env file.");
        toast({ variant: 'destructive', title: 'Configuration Error', description: 'VAPID key for notifications is not set.' });
        return null;
    }

    try {
      const messaging = getMessaging(firebaseApp);
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          serviceWorkerRegistration: swRegistration, // Pass the registration
        });

        if (currentToken) {
          setFcmToken(currentToken);
          const userProfileRef = doc(firestore, `users/${user.uid}/profile/main`);
          await updateDoc(userProfileRef, {
              fcmTokens: arrayUnion(currentToken)
          });
          toast({ title: 'Notifications Enabled!', description: "You're all set to receive messages." });
          return currentToken;
        } else {
          toast({ variant: 'destructive', title: 'Token Error', description: 'Could not get notification token. Please try again.' });
          setFcmToken(null);
          return null;
        }
      } else {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You will not receive notifications. You can enable them in browser settings.' });
        setFcmToken(null);
        return null;
      }
    } catch (error) {
      console.error('An error occurred while setting up notifications:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred during setup.' });
      setFcmToken(null);
      return null;
    }
  }, [firebaseApp, firestore, user, toast]);

  return { requestPermissionAndToken, fcmToken, permissionStatus };
};