// This service worker script is imported by the main PWA service worker.
// It handles Firebase Messaging, specifically the 'notificationclick' event.

// Using compat scripts for broader browser support in service workers
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

let firebaseApp = null;

// Fetch config from our API route and initialize Firebase
// This happens when the service worker is installed.
self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('/api/firebase-config')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch Firebase config');
        }
        return response.json();
      })
      .then(firebaseConfig => {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }
        firebase.messaging(); // Initialize messaging
        console.log('[FCM SW] Firebase initialized successfully.');
      })
      .catch(err => console.error('[FCM SW] Firebase initialization failed:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification click received.', event);
  event.notification.close();

  if (!firebaseApp) {
      console.error('[FCM SW] Firebase not initialized, cannot handle click.');
      return;
  }

  const { action, data } = event;
  const { userId, momentId, dateStr, url } = data || {};
  
  // If user just clicks the notification body (not an action button), open the app.
  if (!action || !['log_yes', 'log_no'].includes(action)) {
    event.waitUntil(clients.openWindow(url || '/'));
    return;
  }

  // Ensure we have the necessary data to log the action.
  if (!userId || !momentId || !dateStr) {
      console.error('[FCM SW] Missing data for logging action:', { userId, momentId, dateStr });
      return;
  }

  const smoked = action === 'log_yes';

  // Send the result to our secure API endpoint.
  // This fetch will be automatically queued by the browser's Background Sync
  // if the user is offline, and sent when the connection is restored.
  const promise = fetch('/api/log-from-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, momentId, dateStr, smoked })
  })
  .then(response => {
      if (!response.ok) {
          console.error('[FCM SW] API call failed:', response.statusText);
      }
  })
  .catch(error => {
      console.error('[FCM SW] Fetch to API failed:', error);
  });
  
  event.waitUntil(promise);
});
