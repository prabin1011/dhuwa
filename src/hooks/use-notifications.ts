
'use client';

import { useEffect, useCallback, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from './use-toast';
import { getVapidKey } from '@/firebase/config';

export function useNotifications() {
  const { firebaseApp, firestore, user } = useFirebase();
  const { toast } = useToast();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [messages, setMessages] = useState<MessagePayload[]>([]);

  const clearMessages = useCallback(() => setMessages([]), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermissionAndToken = useCallback(async () => {
    if (!firebaseApp || !firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sign in first.' });
      return null;
    }

    const supported = await isSupported();
    if (!supported) {
      toast({ variant: 'destructive', title: 'Unsupported', description: 'This browser does not support notifications.' });
      return null;
    }
    
    const vapidKey = getVapidKey();
    if (!vapidKey) {
        console.warn('[FCM] VAPID key is missing. Cannot request token.');
        return null;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission !== 'granted') {
        toast({ variant: 'destructive', title: 'Permission denied', description: 'Enable notifications in browser settings.' });
        return null;
      }
      
      // Get the service worker registration managed by next-pwa
      const swReg = await navigator.serviceWorker.ready;
      
      const messaging = getMessaging(firebaseApp);
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        toast({ variant: 'destructive', title: 'Token error', description: 'Could not get device token.' });
        return null;
      }

      setFcmToken(token);

      const userDocRef = doc(firestore, `users/${user.uid}`);
      await updateDoc(userDocRef, {
        fcmTokens: arrayUnion(token),
      });

      toast({ title: 'Notifications enabled', description: 'You’ll receive reminders here.' });
      return token;
    } catch (err) {
      console.error('[FCM] getToken failed:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to obtain notification token.' });
      return null;
    }
  }, [firebaseApp, firestore, user, toast]);

  return { requestPermissionAndToken, fcmToken, permissionStatus, messages, clearMessages };
}
