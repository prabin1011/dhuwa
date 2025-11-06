'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/provider';
import { Dashboard } from '@/components/dashboard/dashboard';
import { Onboarding } from '@/components/onboarding/onboarding';
import type { Locale } from '@/lib/i18n';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;
  const firestore = useFirestore();

  // If unauthenticated, go to login. No spinner forever.
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [user, isUserLoading, router, locale]);

  // Hooks must be called unconditionally at the top level.
  const ref = useMemoFirebase(() => {
    if (!user) return null; // Handle null user case inside the memo
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading } = useDoc(ref);

  // Now we can have early returns after all hooks are called.
  if (isUserLoading || isLoading) {
    return <div className="h-screen w-screen grid place-items-center">Loading…</div>;
  }
  
  if (!user) {
    return null; // Should be redirected by the useEffect above.
  }

  // Stricter check: only treat explicit `true` as onboarded.
  // undefined, null, or false will all trigger onboarding.
  const onboarded = profile?.hasOnboarded === true;

  if (!onboarded) {
    return <Onboarding />;
  }

  return (
    <div className="h-screen w-screen bg-background">
      <Dashboard user={user} userProfile={{ ...profile, id: user.uid }} />
    </div>
  );
}
