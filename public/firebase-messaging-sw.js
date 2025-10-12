/* eslint-disable no-undef */
/**
 * Firebase Messaging service worker
 * NOTE: Files in /public cannot access process.env.
 * Use the compat SDK + hardcode your public Firebase config.
 */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// COPY THESE FROM YOUR NEXT_PUBLIC_* env vars (they are public-safe)
firebase.initializeApp({
  apiKey:           'YOUR_API_KEY',
  authDomain:       'YOUR_AUTH_DOMAIN',
  projectId:        'YOUR_PROJECT_ID',
  storageBucket:    'YOUR_STORAGE_BUCKET',
  messagingSenderId:'64833989986',
  appId:            'YOUR_APP_ID',
  measurementId:    'YOUR_MEASUREMENT_ID'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
  const title = payload?.notification?.title || 'Dhuwa';
  const options = {
    body: payload?.notification?.body || 'You have a new message.',
    icon: '/icons/icon-192x192.png'
  };
  self.registration.showNotification(title, options);
});
