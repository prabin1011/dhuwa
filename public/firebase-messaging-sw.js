
// A service worker is required for background push notifications.
// For more details, see: https://firebase.google.com/docs/cloud-messaging/js/client
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// **IMPORTANT**: This file must be in the /public folder.

// The Firebase configuration from your project settings.
const firebaseConfig = {
  apiKey: "AIzaSyBg1EMa0HcTFTzwqTIIjqbGMqs92VNCVwM",
  authDomain: "studio-7251750297-88bd3.firebaseapp.com",
  projectId: "studio-7251750297-88bd3",
  storageBucket: "studio-7251750297-88bd3.appspot.com",
  messagingSenderId: "856277572255",
  appId: "1:856277572255:web:8257f924b807ccfaa620aa",
  measurementId: "G-PJ8R05LFX9"
};

// Initialize the Firebase app in the service worker
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

// The service worker doesn't need to do anything else.
// Firebase's `onBackgroundMessage` handler is managed internally.
