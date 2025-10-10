
// This file must be in the public directory.

// Scripts for Firebase products are imported on-demand.
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Your web app's Firebase configuration.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Initialize the Firebase app in the service worker.
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Optional: Set up a background message handler.
// This is called when the app is in the background or closed and a notification is received.
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Dhuwa';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message.',
    icon: '/icon-192x192.png' // Make sure you have an icon in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
