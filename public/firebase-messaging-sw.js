
// A DEV-only stand-in for the real service worker
// In a real app, you would use a build process (like Vite or Webpack)
// to compile the service worker from TypeScript source.

// For now, this is a vanilla JS service worker.

// IMPORTANT: Do not use 'import' statements in this file.
// It's a service worker, not a module.

self.addEventListener('push', (event) => {
  console.log('[SW] Push Received.');
  console.log(`[SW] Push had this data: "${event.data.text()}"`);

  const { title, body, icon, image, ...options } = event.data.json().notification;
  
  const finalTitle = title || 'Dhuwa';
  const finalOptions = {
    body: body || 'You have a new message.',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options
  };

  event.waitUntil(self.registration.showNotification(finalTitle, finalOptions));
});


self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received.');

  event.notification.close();

  // This looks for an existing window and focuses it.
  // If no window is found, it opens a new one.
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then((clientList) => {
      // Check if there's a window open for this origin.
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client)
          return client.focus();
      }
      // If not, open a new one.
      if (clients.openWindow)
        return clients.openWindow('/');
    })
  );
});

