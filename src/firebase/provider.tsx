
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import {
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';

type Ctx = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
};
export const FirebaseContext = createContext<Ctx | undefined>(undefined);

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setIsUserLoading(false);
    });
    return () => unsub();
  }, [auth]);

  const value = useMemo(
    () => ({ firebaseApp, firestore, auth, user, isUserLoading }),
    [firebaseApp, firestore, auth, user, isUserLoading]
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

function useCtx() {
  const c = useContext(FirebaseContext);
  if (!c) throw new Error('Firebase hooks used outside provider');
  return c;
}

export const useFirebase = () => useCtx();
export const useUser = () => {
  const { user, isUserLoading } = useCtx();
  return { user, isUserLoading };
};
export const useFirestore = () => {
  const { firestore } = useCtx();
  if (!firestore) throw new Error('Firestore not ready');
  return firestore;
};
export const useAuth = () => {
  const { auth } = useCtx();
  if (!auth) throw new Error('Auth not ready');
  return auth;
};

export const useAuthActions = () => {
  const auth = useAuth();
  const firestore = useFirestore();

  const signUpWithEmail = async (email: string, password: string, username?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    // Check if the user is not anonymous before proceeding
    if (!cred.user.isAnonymous) {
        if (username) await updateProfile(cred.user, { displayName: username });
    
        // Also send the verification email, but don't block on it
        sendEmailVerification(cred.user);

        // Create user profile document
        await setDoc(
          doc(firestore, 'users', cred.user.uid),
          {
            email,
            username: username || '',
            createdAt: serverTimestamp(),
            hasOnboarded: false,
          },
          { merge: true }
        );
    }
    
    return cred;
  };

  const signInWithEmail = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const sendPasswordReset = (email: string) => sendPasswordResetEmail(auth, email);

  const signOut = () => fbSignOut(auth);

  return { signUpWithEmail, signInWithEmail, sendPasswordReset, signOut };
};


export * from './firestore/use-doc';
export * from './firestore/use-collection';
