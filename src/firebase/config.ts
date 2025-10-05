export const firebaseConfig = {
  "projectId": "studio-7251750297-88bd3",
  "appId": "1:856277572255:web:8257f924b807ccfaa620aa",
  "apiKey": "AIzaSyBg1EMa0HcTFTzwqTIIjqbGMqs92VNCVwM",
  "authDomain": "studio-7251750297-88bd3.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "856277572255",
  "vapidKey": "YOUR_VAPID_KEY"
};

// This function is for the service worker and should only include serializable config.
export function getFirebaseConfig() {
  if (!firebaseConfig.apiKey) {
    throw new Error('Missing Firebase API Key');
  }
  return firebaseConfig;
}
