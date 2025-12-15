// This is a basic service worker to make the app installable.
// It doesn't provide offline functionality yet.

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // This basic fetch handler is required to make the app installable.
  event.respondWith(fetch(event.request));
});
