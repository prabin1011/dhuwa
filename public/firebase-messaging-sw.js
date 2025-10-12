/* eslint-disable no-undef */
/**
 * Firebase Messaging service worker
 * IMPORTANT: files in /public cannot read process.env. Use compat + hardcode senderId.
 */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Public info; safe to inline:
firebase.initializeApp({
  messagingSenderId: '64833989986'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
  const title = payload?.notification?.title || 'Dhuwa';
  const options = {
    body: payload?.notification?.body || 'You have a new message.',
    icon: '/icons/icon-192x192.png', // ensure this exists
  };
  self.registration.showNotification(title, options);
});
