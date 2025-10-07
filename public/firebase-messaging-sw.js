// Import the Firebase app and messaging services
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';
import { getFirebaseConfig } from '../src/firebase/config';

// Initialize the Firebase app in the service worker with the shared config
const firebaseApp = initializeApp(getFirebaseConfig());

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = getMessaging(firebaseApp);

// If you want to customize the background notification handling, you can add a listener here.
// For now, the default behavior will show the notification sent from FCM.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.', event.data.json());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.FCM_MSG.notification.click_action || '/')
    );
});
