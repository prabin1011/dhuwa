
'use client';

import {useParams} from 'next/navigation';
import {useRouter} from 'next-intl/navigation';
import type {Locale} from '@/i18n';
import {useUser, useFirestore, useMemoFirebase} from '@/firebase';
import {doc} from 'firebase/firestore';
import {useDoc} from '@/firebase/firestore/use-doc';
import {Onboarding} from '@/components/onboarding/onboarding';
import {Dashboard as DashboardUI} from '@/components/dashboard/dashboard';
import { WelcomeIllustration } from '@/components/illustrations/welcome';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const {locale} = useParams() as {locale: Locale};
  const {user, isUserLoading} = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Redirect to login only after auth state is known and there's no user.
    if (!isUserLoading && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [isUserLoading, user, router, locale]);


  // Build the user profile ref when user exists
  const ref = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const {data: profile, isLoading} = useDoc(ref);

  if (isUserLoading || isLoading) {
    return (
        <div className="h-screen w-screen grid place-items-center text-center p-4">
            <div className="flex flex-col items-center gap-4">
                <WelcomeIllustration />
                <p className="text-muted-foreground animate-pulse">Loading Your Space...</p>
            </div>
        </div>
    );
  }

  // If there's no user, the useEffect above has already initiated the redirect.
  // Return null to prevent rendering anything further.
  if (!user) return null;

  const onboarded = profile?.hasOnboarded === true;
  if (!onboarded) return <Onboarding />;

  return (
    <div className="h-screen w-screen bg-background">
      <DashboardUI user={user} userProfile={{...profile, id: user.uid}} />
    </div>
  );
}
