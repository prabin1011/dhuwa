/* public/firebase-messaging-sw.js */

/* Use compat builds (works in a plain SW file) */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

/* 🔴 Replace these with your exact Web App config from Firebase Console > Project settings */
firebase.initializeApp({
  apiKey: "AIzaSyBg1EMa0HcTFTzwqTIIjqbGMqs92VNCVwM",
  authDomain: "studio-7251750297-88bd3.firebaseapp.com",
  projectId: "studio-7251750297-88bd3",
  storageBucket: "studio-7251750297-88bd3.appspot.com",
  messagingSenderId: "856277572255",
  appId: "1:856277572255:web:8257f924b807ccfaa620aa",
});

/* Get messaging instance */
const messaging = firebase.messaging();

/* Handle data-only payloads when app is in the background */
messaging.onBackgroundMessage((payload) => {
  // Works for "data" payloads (Console: “Additional options” → Custom data)
  const n = payload.notification || {};
  const d = payload.data || {};

  const title = n.title || d.title || 'The Easy Way Out';
  const body  = n.body  || d.body  || 'Open the app for details.';
  const icon  = n.icon  || '/icons/icon-192x192.png';
  const url   = d.link || d.url || n.click_action || '/';

  self.registration.showNotification(title, {
    body,
    icon,
    tag: d.tag || 'tewo',
    data: { url },
    requireInteraction: false,
  });
});

/* Ensure clicks focus or open the app */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const absolute = new URL(target, self.location.origin).href;
      for (const client of list) {
        if (client.url === absolute) return client.focus();
      }
      return clients.openWindow(absolute);
    })
  );
});
