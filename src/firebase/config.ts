
import type { FirebaseOptions } from 'firebase/app';

// This function is for the service worker and should only include serializable config.
export function getFirebaseConfig(): FirebaseOptions {
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  if (!firebaseConfig.apiKey) {
    throw new Error('Missing Firebase API Key from environment variables. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set.');
  }
  return firebaseConfig;
}

export function getVapidKey(): string {
    // This VAPID key is a public key, it's safe to be here.
    // Return an empty string if not set, to be handled gracefully by the calling function.
    return process.env.NEXT_PUBLIC_VAPID_KEY || '';
}
