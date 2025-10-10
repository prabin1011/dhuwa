'use client';

import React, { useState, useEffect, type ReactNode, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// A simple loading component to show while Firebase is initializing.
const GlobalLoader = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
             <p>Connecting...</p>
             <Skeleton className="h-4 w-48" />
        </div>
    </div>
);

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<{
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once on mount to initialize Firebase.
    const init = async () => {
      try {
        const firebaseServices = initializeFirebase(); // This is now synchronous
        setServices(firebaseServices);
      } catch (err: any) {
        console.error("Firebase initialization failed:", err);
        setError(err.message || "Could not connect to services.");
      }
    };
    init();
  }, []); // Empty dependency array ensures this runs only once.

  if (error) {
     return (
        <div className="flex h-screen w-screen items-center justify-center p-4 text-center">
            <p className="text-destructive">Error: {error}</p>
        </div>
     );
  }

  // If services are not yet initialized, show the loader.
  if (!services) {
    return <GlobalLoader />;
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
