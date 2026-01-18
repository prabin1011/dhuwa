
const CACHE_NAME = 'dhuwa-cache-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_ASSETS = [
    OFFLINE_URL,
    '/192x192.png',
    '/512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone the response to cache it
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return caches.match(event.request)
                        .then(response => response || caches.match(OFFLINE_URL));
                })
        );
    } else if (PRECACHE_ASSETS.some(asset => event.request.url.endsWith(asset))) {
         // For precached assets, use a cache-first strategy
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
        );
    } else {
        // For other requests (API calls, dynamic assets), use a network-first strategy
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => caches.match(event.request).then(response => {
                    // For failed API calls etc., we don't want to return the offline page,
                    // so we just let the failure happen if it's not in the cache.
                    if (response) return response;
                }))
        );
    }
});


self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;
    const data = notification.data;

    notification.close();

    if (action === 'log_yes' || action === 'log_no') {
        const smoked = action === 'log_yes';
        
        // This is the fetch request that will be sent to your API
        const promise = fetch('/api/log-from-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: data.userId,
                momentId: data.momentId,
                dateStr: data.dateStr,
                smoked: smoked
            })
        }).then(response => {
            if (!response.ok) {
                console.error('Failed to log from notification:', response.statusText);
            }
        }).catch(err => {
            console.error('Fetch error in service worker:', err);
        });

        event.waitUntil(promise);
    } else if (data.url) {
        // This handles clicks on the notification body itself (not the action buttons)
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
                for (let client of windowClients) {
                    if (client.url === data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(data.url);
                }
            })
        );
    }
});

self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Dhuwa';
    const options = {
        body: data.body || 'A new message from Dhuwa.',
        icon: '/192x192.png',
        badge: '/192x192.png',
        ...data,
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

