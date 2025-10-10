'use client';

import { useUser, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import { Onboarding } from '@/components/onboarding/onboarding';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthActions, useFirestore, useDoc } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { signOut } = useAuthActions();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid, 'profile', 'main');
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const handleResendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your inbox (and spam folder).',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error Sending Email',
          description: error.message,
        });
      }
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (isUserLoading || (user && isProfileLoading)) {
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
  
  const providerId = user?.providerData?.[0]?.providerId;
  const requiresVerification = providerId === 'password' && !!user?.email;

  if (user && requiresVerification && !user.emailVerified) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTitle>Verify Your Email</AlertTitle>
          <AlertDescription>
            A verification link has been sent to <strong>{user.email}</strong>. Please check your inbox and click the link to continue.
          </AlertDescription>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button onClick={handleResendVerification}>Resend Verification Email</Button>
            <Button variant="outline" onClick={handleSignOut}>Use a different account</Button>
          </div>
        </Alert>
      </div>
    );
  }

  // A user who has not completed onboarding.
  if (user && userProfile && !userProfile.goal) {
    return <Onboarding />;
  }

  // If user is logged in and has a full profile, show the dashboard.
  if (user && userProfile) {
    return (
      <div className="h-screen w-screen bg-background">
        <Dashboard user={user} userProfile={{...userProfile, id: user.uid}} />
      </div>
    );
  }
  
  // This case handles a logged-in user whose profile document is still loading or doesn't exist yet,
  // which might briefly happen right after sign-up. The Onboarding check will run on the next render.
  if (user && !userProfile) {
     return <Onboarding />;
  }
  
  // Fallback while redirects or state updates are happening.
  return null;
}
