// This file must be in the public folder.

// We need to import the app and messaging SDKs
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// A utility function to fetch the config from a server endpoint.
// This is necessary because environment variables are not available in the service worker.
async function getFirebaseConfig() {
    try {
        // The fetch URL MUST be an absolute path.
        const response = await fetch('/api/firebase-config');
        if (!response.ok) {
            throw new Error('Failed to fetch Firebase config');
        }
        const config = await response.json();
        return config;
    } catch (error) {
        console.error('Error fetching Firebase config in SW:', error);
        return null;
    }
}

// Main logic to initialize Firebase and set up message handling
async function initialize() {
    const firebaseConfig = await getFirebaseConfig();

    if (!firebaseConfig) {
        console.error("Firebase config not found, service worker cannot initialize.");
        return;
    }
    
    // Initialize the Firebase app in the service worker
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    onBackgroundMessage(messaging, (payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        
        const notificationTitle = payload.notification?.title || "New Message";
        const notificationOptions = {
            body: payload.notification?.body || "You have a new message.",
            icon: payload.notification?.icon || '/icons/icon-192x192.png'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

initialize();
