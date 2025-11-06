'use client';

import {useParams, useRouter} from 'next/navigation';
import type {Locale} from '@/i18n';
import {useUser, useFirestore, useMemoFirebase} from '@/firebase';
import {doc} from 'firebase/firestore';
import {useDoc} from '@/firebase/firestore/use-doc';
import {Onboarding} from '@/components/onboarding/onboarding';
import {Dashboard as DashboardUI} from '@/components/dashboard/dashboard';
import { WelcomeIllustration } from '@/components/illustrations/welcome';

export default function DashboardPage() {
  const router = useRouter();
  const {locale} = useParams() as {locale: Locale};
  const {user, isUserLoading} = useUser();
  const firestore = useFirestore();

  // Redirect to login only after auth is known
  if (!isUserLoading && !user) {
    router.replace(`/${locale}/login`);
    return null;
  }

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

  if (!user) return null; // redirect already triggered

  const onboarded = profile?.hasOnboarded === true;
  if (!onboarded) return <Onboarding />;

  return (
    <div className="h-screen w-screen bg-background">
      <DashboardUI user={user} userProfile={{...profile, id: user.uid}} />
    </div>
  );
}
