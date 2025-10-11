
// This file needs to be in the public directory.

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker with your project's config.
// The config object should be sourced from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyBg1EMa0HcTFTzwqTIIjqbGMqs92VNCVwM",
  authDomain: "dhuwa-app.firebaseapp.com",
  projectId: "dhuwa-app",
  storageBucket: "dhuwa-app.appspot.com",
  messagingSenderId: "1083654536269",
  appId: "1:1083654536269:web:9b975d5955b08e5e89a558",
  measurementId: "G-1J9EZ194VE"
};


firebase.initializeApp(firebaseConfig);


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Make sure you have a logo in your public folder
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
