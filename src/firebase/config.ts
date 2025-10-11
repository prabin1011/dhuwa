
import type { FirebaseOptions } from 'firebase/app';

// This function is for the service worker and should only include serializable config.
export function getFirebaseConfig(): FirebaseOptions {
  const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyBg1EMa0HcTFTzwqTIIjqbGMqs92VNCVwM",
    authDomain: "dhuwa-app.firebaseapp.com",
    projectId: "dhuwa-app",
    storageBucket: "dhuwa-app.appspot.com",
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
    // This VAPID key is a public key, it's safe to be here.
    return "BPA9w_tGzYcDxA40f_1KjBqC-A1g_n_pZ2zX7J3cR1rJzR_kL5pZ2l5fJ5d9Z1wX8xX5gZ7J9yX7j4";
}
