// public/firebase-messaging-sw.js

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// This function needs to be defined within the service worker scope.
// It returns a minimal config object required for messaging.
function getFirebaseConfig() {
  // This value is public and used to identify your app's Firebase project.
  return {
    messagingSenderId: "856277572255", // Replace with your actual sender ID if different
  };
}

// Initialize the Firebase app in the service worker by passing in
// the messagingSenderId.
const firebaseConfig = getFirebaseConfig();

// It's important to check if the app is already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // You can add an icon here, make sure the file exists in your public folder
    // icon: '/logo.png' 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
