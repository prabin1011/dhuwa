// The Easy Way Out - Service Worker

const CACHE_NAME = 'dhuwa-cache-v1';
// URLs to cache on installation. Adjust this list as your app grows.
const urlsToCache = [
  '/',
  '/en/dashboard',
  '/manifest.json',
  '/192x192.png',
  '/512x512.png',
  '/1080x1080.png',
];

// 1. Installation: Caching the App Shell
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] Caching failed', err);
      })
  );
});

// 2. Activation: Cleaning up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch: Serving cached content when offline
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  // For navigation requests, use a network-first strategy to ensure users get the latest version.
  if (event.request.mode === 'navigate') {
     event.respondWith(
        fetch(event.request).catch(() => caches.match('/'))
     );
     return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
           // Optionally, you could cache new resources here dynamically.
           return fetchResponse;
        });
      })
  );
});


// 4. Notification Click: Handling notification actions
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action; // e.g., 'log_yes' or 'log_no'
  const data = notification.data;

  notification.close();

  // If the user clicked a "log smoke" action
  if (data && data.action === 'log_smoke_result' && (action === 'log_yes' || action === 'log_no')) {
    const smoked = action === 'log_yes';

    // This is an async operation, so we must wrap it in waitUntil
    const logPromise = fetch('/api/log-from-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smoked,
        userId: data.userId,
        momentId: data.momentId,
        dateStr: data.dateStr,
      }),
    })
    .then(response => {
        if (!response.ok) {
            console.error('[SW] Failed to log smoke from notification:', response.statusText);
        } else {
            console.log('[SW] Successfully logged smoke from notification.');
        }
    })
    .catch(error => {
        console.error('[SW] Error logging smoke from notification:', error);
    });

    event.waitUntil(logPromise);
  }

  // If it's a simple reminder click, just open the app
  else {
     event.waitUntil(clients.openWindow(data && data.url ? data.url : '/'));
  }
});
