
export const firebaseConfig = {
  "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  "authDomain": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  "measurementId": process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  "storageBucket": process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  "vapidKey": process.env.NEXT_PUBLIC_VAPID_KEY
};

// This function is for the service worker and should only include serializable config.
export function getFirebaseConfig() {
  if (!firebaseConfig.apiKey) {
    throw new Error('Missing Firebase API Key');
  }
  return firebaseConfig;
}
