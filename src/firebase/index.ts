'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { 
  type Firestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getFirebaseConfig } from './config';

// This structure will hold the initialized services.
// It's defined once and can be reused.
let firebaseServices: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null = null;


// This function fetches the config and initializes Firebase.
// It ensures that initialization only happens once.
export function initializeFirebase() {
  if (firebaseServices) {
    return firebaseServices;
  }

  const firebaseConfig = getFirebaseConfig();

  // Initialize the Firebase app.
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  // No production console logs
  if (process.env.NODE_ENV !== 'production') {
    console.info('[Firebase Config]',
      JSON.stringify({
        projectId: app.options.projectId,
        authDomain: app.options.authDomain,
        apiKeyPresent: !!app.options.apiKey,
      })
    );
  }
  
  let firestore: Firestore;
  try {
    // Initialize Firestore with offline persistence
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    console.warn("[Firestore] Offline persistence failed to initialize. Falling back to in-memory persistence.", e);
    // Fallback to in-memory persistence if offline fails
    firestore = initializeFirestore(app, {});
  }
  
  // Store the initialized services so we don't have to do this again.
  firebaseServices = {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: firestore,
  };

  return firebaseServices;
}

// Re-export other necessary hooks and utilities
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './use-memo-firebase';
