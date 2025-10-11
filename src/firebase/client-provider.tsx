'use client';

import React, { type ReactNode, useState, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      // Initialize Firebase services only on the client-side
      const firebaseServices = initializeFirebase();
      setServices(firebaseServices);
    } catch (err: any) {
      console.error("Firebase initialization failed:", err);
      setError(err.message || "Could not connect to services.");
    } finally {
      setIsInitializing(false);
    }
  }, []); // Empty dependency array ensures this runs only once on the client

  if (isInitializing) {
     return (
        <div className="flex h-screen w-screen items-center justify-center p-4 text-center">
            <p>Initializing Services...</p>
        </div>
     );
  }

  if (error) {
     return (
        <div className="flex h-screen w-screen items-center justify-center p-4 text-center">
            <p className="text-destructive">Error: {error}</p>
        </div>
     );
  }

  if (!services) {
    // This case should ideally not be reached if initialization is handled correctly
    return (
        <div className="flex h-screen w-screen items-center justify-center p-4 text-center">
            <p>Could not initialize Firebase services.</p>
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
      <FirebaseErrorListener />
    </FirebaseProvider>
  );
}
