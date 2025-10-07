
// A intentionally-blank file for the service worker.
// The Firebase SDK will dynamically import the necessary scripts.
// See: https://firebase.google.com/docs/cloud-messaging/js/client#retrieve-the-current-registration-token

// This import is essential for the service worker to be recognized by Firebase.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// This configuration will be dynamically replaced by a build script or environment variable.
// IMPORTANT: Do not hardcode your actual Firebase config here in a real app.
const firebaseConfig = {
  apiKey: "AIzaSyBg1EMa0HcTFTzwqTIIjqbGMqs92VNCVwM",
  authDomain: "studio-7251750297-88bd3.firebaseapp.com",
  projectId: "studio-7251750297-88bd3",
  storageBucket: "studio-7251750297-88bd3.appspot.com",
  messagingSenderId: "856277572255",
  appId: "1:856277572255:web:8257f924b807ccfaa620aa"
};


firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
