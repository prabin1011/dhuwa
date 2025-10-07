
'use client';

import { useEffect, useCallback, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from './use-toast';

const SW_URL = '/firebase-messaging-sw.js';

async function ensureMessagingSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  const regs = await navigator.serviceWorker.getRegistrations();
  const existing =
    regs.find(r =>
      r.active?.scriptURL.endsWith(SW_URL) ||
      r.waiting?.scriptURL.endsWith(SW_URL) ||
      r.installing?.scriptURL.endsWith(SW_URL)
    ) || null;

  if (existing) return existing;

  try {
    return await navigator.serviceWorker.register(SW_URL, { scope: '/' });
  } catch (e) {
    console.error('SW register failed', e);
    return null;
  }
}

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

  useEffect(() => {
    if (!firebaseApp || !isSupported()) return;

    const setupMessaging = async () => {
      try {
        if (!(await isSupported())) {
            console.log("FCM is not supported in this browser.");
            return;
        }
        const messaging = getMessaging(firebaseApp);
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message received.', payload);
          toast({
            title: payload.notification?.title || "New Message",
            description: payload.notification?.body,
          });
          setMessages(prev => [payload, ...prev]);
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up foreground message handler:", error);
      }
    };
    
    const unsubscribePromise = setupMessaging();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [firebaseApp, toast]);

  const requestPermissionAndToken = useCallback(async () => {
    if (!firebaseApp || !firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sign in first.' });
      return null;
    }

    if (!('Notification' in window)) {
      toast({ variant: 'destructive', title: 'Unsupported', description: 'This browser does not support notifications.' });
      return null;
    }

    const vapid = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapid) {
      toast({ variant: 'destructive', title: 'Config error', description: 'Missing NEXT_PUBLIC_VAPID_KEY' });
      return null;
    }

    const swReg = await ensureMessagingSW();
    if (!swReg) {
      toast({ variant: 'destructive', title: 'Setup failed', description: 'Couldn’t register service worker.' });
      return null;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission !== 'granted') {
      toast({ variant: 'destructive', title: 'Permission denied', description: 'Enable notifications in browser settings.' });
      return null;
    }

    try {
      if (!(await isSupported())) {
        toast({ variant: 'destructive', title: 'Unsupported', description: 'Messaging not supported in this browser.' });
        return null;
      }

      const messaging = getMessaging(firebaseApp);
      const token = await getToken(messaging, {
        vapidKey: vapid,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        toast({ variant: 'destructive', title: 'Token error', description: 'Could not get device token.' });
        return null;
      }

      setFcmToken(token);

      await updateDoc(doc(firestore, `users/${user.uid}/profile/main`), {
        fcmTokens: arrayUnion(token),
      });

      toast({ title: 'Notifications enabled', description: 'You’ll receive reminders here.' });
      return token;
    } catch (err) {
      console.error('FCM token error', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to obtain token.' });
      return null;
    }
  }, [firebaseApp, firestore, user, toast]);

  return { requestPermissionAndToken, fcmToken, permissionStatus, messages, clearMessages };
}
