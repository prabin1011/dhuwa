'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// This structure will hold the initialized services.
// It's defined once and can be reused.
let firebaseServices: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null = null;


// This function fetches the config and initializes Firebase.
// It ensures that initialization only happens once.
export async function initializeFirebase() {
  if (firebaseServices) {
    return firebaseServices;
  }

  // Fetch the configuration from our secure API route.
  const res = await fetch('/api/firebase-config');
  if (!res.ok) {
    throw new Error('Failed to fetch Firebase config.');
  }
  const firebaseConfig = await res.json();

  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase API key is missing from config.');
  }
  
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
  
  // Store the initialized services so we don't have to do this again.
  firebaseServices = {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
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