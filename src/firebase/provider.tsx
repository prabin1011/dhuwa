'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, updateProfile, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
      user,
      isUserLoading,
    };
  }, [firebaseApp, firestore, auth, user, isUserLoading]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

function useFirebaseContext() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error("useFirebaseContext must be used within a FirebaseProvider.");
    }
    return context;
}

export const useFirebase = () => {
    return useFirebaseContext();
}

export const useAuth = (): Auth => {
  const { auth } = useFirebaseContext();
  if (!auth) throw new Error("Auth service not available.");
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseContext();
  if (!firestore) throw new Error("Firestore service not available.");
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebaseContext();
  if (!firebaseApp) throw new Error("Firebase App not available.");
  return firebaseApp;
};

export const useUser = () => {
    const { user, isUserLoading } = useFirebaseContext();
    return { user, isUserLoading };
}

export const useAuthActions = () => {
  const auth = useAuth();
  const firestore = useFirestore();

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(firestore, 'users', cred.user.uid);
    await setDoc(userRef, {
      email,
      username,
      createdAt: serverTimestamp(),
    }, { merge: true });

    await updateProfile(cred.user, { displayName: username });
    await sendEmailVerification(cred.user);
    return cred;
  };

  const signInWithEmail = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };
  
  const signOut = () => {
    return fbSignOut(auth);
  };

  return { signUpWithEmail, signInWithEmail, sendPasswordReset, signOut };
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export * from './firestore/use-doc';
