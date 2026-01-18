// This service worker is intentionally kept simple for now.
// Its primary role is to ensure the web app can show notifications.

self.addEventListener('install', (event) => {
  // console.log('Service Worker installing.');
  // Skip waiting to ensure the new service worker activates immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // console.log('Service Worker activating.');
  // Take control of all clients as soon as the service worker activates.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  // console.log('Notification clicked.');
  event.notification.close();

  // This function looks for an open window/tab for this web app and focuses it.
  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If a window for this app is already open, focus it.
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one.
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});
