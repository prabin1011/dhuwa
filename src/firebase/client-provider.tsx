'use client';

import React, { type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Initialize Firebase immediately at the module level.
// This ensures it's done only once for the entire client session.
let services: {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
} | null = null;

let error: string | null = null;

try {
  services = initializeFirebase();
} catch (err: any) {
  console.error("Firebase initialization failed:", err);
  error = err.message || "Could not connect to services.";
}


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  
  if (error) {
     return (
        <div className="flex h-screen w-screen items-center justify-center p-4 text-center">
            <p className="text-destructive">Error: {error}</p>
        </div>
     );
  }

  // This should ideally not happen if initialization is successful.
  if (!services) {
     return (
        <div className="flex h-screen w-screen items-center justify-center p-4 text-center">
            <p>Initializing...</p>
        </div>
     );
  }

  // Once services are ready, render the main provider.
  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}