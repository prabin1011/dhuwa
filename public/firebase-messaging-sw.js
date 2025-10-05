// This file needs to be in the public folder.
// It's a service worker that will handle background notifications.

// In a real app, you would import and initialize Firebase here.
// For now, this is a placeholder.

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'AI Coach';
  const options = {
    body: event.data.text(),
    icon: '/icon.png',
    badge: '/badge.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
