'use client';

import {useParams, useRouter} from 'next/navigation';
import type {Locale} from '@/i18n';
import {useUser, useFirestore, useMemoFirebase} from '@/firebase';
import {doc} from 'firebase/firestore';
import {useDoc} from '@/firebase/firestore/use-doc';
import {Onboarding} from '@/components/onboarding/onboarding';
import {Dashboard as DashboardUI} from '@/components/dashboard/dashboard';
import { WelcomeIllustration } from '@/components/illustrations/welcome';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const {locale} = useParams() as {locale: Locale};
  const {user, isUserLoading} = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Redirect to login only after auth state is known, there's no user, AND we are online.
    if (!isUserLoading && !user && typeof navigator !== 'undefined' && navigator.onLine) {
      router.replace(`/${locale}/login`);
    }
  }, [isUserLoading, user, router, locale]);


  // Build the user profile ref only when user and firestore are available.
  const ref = useMemoFirebase(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [firestore, user]);

  const {data: profile, isLoading: isProfileLoading} = useDoc(ref);

  if (isUserLoading || (user && isProfileLoading)) {
    return (
        <div className="h-screen w-screen grid place-items-center text-center p-4">
            <div className="flex flex-col items-center gap-4">
                <WelcomeIllustration />
                <p className="text-muted-foreground animate-pulse">Loading Your Space...</p>
            </div>
        </div>
    );
  }

  // If there's no user (and we're likely online), the useEffect redirect will handle it.
  // If offline, we might land here temporarily.
  if (!user) {
       return (
            <div className="h-screen w-screen grid place-items-center text-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <WelcomeIllustration />
                    <h1 className="text-2xl font-bold">You're Offline</h1>
                    <p className="text-muted-foreground">Please connect to log in and view your dashboard.</p>
                </div>
            </div>
       )
  };

  const onboarded = profile?.hasOnboarded === true;
  if (!onboarded) {
    // If offline and profile isn't loaded from cache, don't show onboarding.
    if (typeof navigator !== 'undefined' && !navigator.onLine && !profile) {
        return (
           <div className="h-screen w-screen grid place-items-center text-center p-4">
              <div className="flex flex-col items-center gap-4">
                  <WelcomeIllustration />
                  <h1 className="text-2xl font-bold">You're Offline</h1>
                  <p className="text-muted-foreground max-w-xs">Your profile couldn't be loaded from the cache. Please connect to the internet to complete setup or view your data.</p>
              </div>
          </div>
        )
    }
    return <Onboarding />;
  }

  return (
    <div className="h-screen w-screen bg-background">
      <DashboardUI user={user} userProfile={{...profile, id: user.uid}} />
    </div>
  );
}
