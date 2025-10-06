'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';

export default function App() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // Ref for the main onboarding profile
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `users/${user.uid}/profile/main`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // Ref for the anonymous user profile (used to check if it's their first time)
  const anonymousProfileRef = useMemoFirebase(() => {
    if (!user || !user.isAnonymous) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: anonymousProfile, isLoading: isAnonymousProfileLoading } = useDoc(anonymousProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || (user && (isProfileLoading || (user.isAnonymous && isAnonymousProfileLoading)));

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-screen bg-background p-4 md:p-8 lg:p-12 gap-8">
        <div className="w-full max-w-7xl mx-auto">
          <Skeleton className="h-12 w-1/4 mb-2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Skeleton className="h-48 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
            <div className="lg:col-span-1">
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
      </div>
    );
  }

  // A full user (not anonymous) who hasn't completed onboarding.
  if (user && !user.isAnonymous && !userProfile) {
    return <Onboarding />;
  }

  // An anonymous user who exists but hasn't completed onboarding.
  if (user && user.isAnonymous && anonymousProfile && !userProfile) {
    return <Onboarding />;
  }

  // If user is logged in and has a full profile, show the dashboard.
  if (user && userProfile) {
    return (
      <div className="h-screen w-screen bg-background">
        <Dashboard userProfile={userProfile} />
      </div>
    );
  }
  
  // Fallback for any other state (e.g., user exists but anonymous profile check failed)
  // This could briefly show while redirects or state updates are happening.
  return null;
}
