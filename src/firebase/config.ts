
import type { FirebaseOptions } from 'firebase/app';

// This function is for the service worker and should only include serializable config.
export function getFirebaseConfig(): FirebaseOptions {
  const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyBg1EMa0HcTFTzwqTIIjqbGMqs92VNCVwM",
    authDomain: "studio-7251750297-88bd3.firebaseapp.com",
    projectId: "studio-7251750297-88bd3",
    storageBucket: "studio-7251750297-88bd3.appspot.com",
    messagingSenderId: "856277572255",
    appId: "1:856277572255:web:8257f924b807ccfaa620aa",
    measurementId: "G-PJ8R05LFX9"
  };

  if (!firebaseConfig.apiKey) {
    throw new Error('Missing Firebase API Key from environment variables. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set.');
  }
  return firebaseConfig;
}

export function getVapidKey(): string | undefined {
    return process.env.NEXT_PUBLIC_VAPID_KEY;
}
