
// A service worker is a background script that runs in the browser, separate from the web page.
// It's essential for receiving and displaying push notifications when your app is not in the active browser tab.

// Import the Firebase app and messaging scripts. These are served by Firebase's hosting.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

let firebaseApp;

// This is the core of the fix.
// We fetch our app's specific Firebase configuration from the API route we created.
// This ensures the service worker knows which Firebase project to connect to.
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(firebaseConfig => {
    // Initialize the Firebase app with the fetched configuration.
    firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log("Firebase service worker initialized with config:", firebaseConfig);

    // Get an instance of Firebase Messaging.
    const messaging = firebase.messaging();

    // Set up a listener for when a message is received while the app is in the background.
    messaging.onBackgroundMessage((payload) => {
      console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
      );

      // Customize the notification's title, body, and icon.
      const notificationTitle = payload.notification.title || "New Message";
      const notificationOptions = {
        body: payload.notification.body || "",
        icon: "/icons/icon-192x192.png", // A default icon for notifications
      };

      // Use the service worker's registration to show the notification.
      self.registration.showNotification(notificationTitle, notificationOptions);
    });

  }).catch(error => {
    console.error("Error fetching Firebase config in service worker:", error);
  });


// Add an event listener for when a user clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();

  // This opens the app's URL when the notification is clicked.
  event.waitUntil(
    clients.openWindow('/')
  );
});
