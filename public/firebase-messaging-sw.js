/* eslint-disable no-undef */
/**
 * Firebase Messaging service worker.
 * NOTE: Files under /public are served as-is; no env replacement happens here.
 * Use the compat SDK and only the messagingSenderId.
 */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ONLY the sender ID is required in the SW. This value is public.
firebase.initializeApp({
  messagingSenderId: '64833989986'
});

const messaging = firebase.messaging();

/** Handle background messages */
messaging.onBackgroundMessage((payload) => {
  // Optional: customize your notification
  const title = payload?.notification?.title || 'Dhuwa';
  const options = {
    body: payload?.notification?.body || 'You have a new message.',
    icon: '/icon-192x192.png'
  };
  self.registration.showNotification(title, options);
});
