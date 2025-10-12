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
  apiKey: "AIzaSyD1f-BcMWSEcRVxVa67OvfDMXK-kSmLP2g",
  authDomain: "studio-7251750297-88bd3.firebaseapp.com",
  projectId: "studio-7251750297-88bd3",
  storageBucket: "studio-7251750297-88bd3.appspot.com",
  messagingSenderId: "64833989986",
  appId: "1:64833989986:web:3552271612a21e7845c439",
  measurementId: "G-PJ8R05LFX9"
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
