// src/hooks/use-notifications.ts (client component)
'use client';

import { useEffect, useCallback, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from './use-toast';

const SW_URL = '/firebase-messaging-sw.js';

async function ensureMessagingSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  // Reuse if already registered
  const regs = await navigator.serviceWorker.getRegistrations();
  const existing =
    regs.find(r =>
      r.active?.scriptURL.endsWith(SW_URL) ||
      r.waiting?.scriptURL.endsWith(SW_URL) ||
      r.installing?.scriptURL.endsWith(SW_URL)
    ) || null;

  if (existing) return existing;

  // Otherwise register
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
  const [lastMessage, setLastMessage] = useState<MessagePayload | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // foreground messages (while tab is focused)
  useEffect(() => {
    (async () => {
      if (!firebaseApp) return;
      if (!(await isSupported())) return;

      const messaging = getMessaging(firebaseApp);
      return onMessage(messaging, (payload) => {
        // optional: show an in-app toast/banner
        const title = payload.notification?.title || 'Notification';
        const body  = payload.notification?.body  || '';
        toast({ title, description: body });
        setLastMessage(payload);
      });
    })();
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

    // Must be your Console > Cloud Messaging > Web Push certificates > Public key
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

    const permission = await Notification.requestPermission(); // call this from a user gesture (button click)
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
        serviceWorkerRegistration: swReg,   // 🔑 bind token to the SW we registered
      });

      if (!token) {
        toast({ variant: 'destructive', title: 'Token error', description: 'Could not get device token.' });
        return null;
      }

      setFcmToken(token);

      // Save the token for your server/Cloud Functions to target
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

  return { requestPermissionAndToken, fcmToken, permissionStatus, lastMessage, setLastMessage };
}
