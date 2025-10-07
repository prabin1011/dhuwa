
// A dedicated service worker for Firebase Cloud Messaging.
// It's important that this file is in the 'public' directory.

// Import the Firebase SDKs
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// This is a placeholder for the config that will be fetched.
let firebaseConfig = null;

// Fetch config from our new API route
self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('/api/firebase-config')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch Firebase config');
        }
        return response.json();
      })
      .then(config => {
        firebaseConfig = config;
      })
      .catch(error => {
        console.error('Service Worker: Error fetching Firebase config:', error);
      })
  );
});


self.addEventListener('activate', event => {
    // This ensures the new service worker takes over immediately.
    event.waitUntil(clients.claim());
});


// A utility function to ensure Firebase is initialized.
const ensureFirebaseInitialized = () => {
  if (!firebase.apps.length && firebaseConfig) {
    firebase.initializeApp(firebaseConfig);
  }
};


// Handle background push notifications
self.addEventListener('push', (event) => {
  ensureFirebaseInitialized();

  if (!event.data) {
    console.log("Push event has no data.");
    return;
  }

  const payload = event.data.json();
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icons/icon-192x192.png',
    data: {
      url: payload.notification.click_action || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});


// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open for the app
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
