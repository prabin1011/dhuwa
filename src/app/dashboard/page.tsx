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

  // This is the correct path for the user profile data from onboarding.
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    // If auth is done loading and there is no user, redirect to login page.
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
    router.push('/login'); // Redirect to login after signing out
  };

  // Show a global loading skeleton while auth state or profile is loading
  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If auth is resolved and there's no user, the useEffect above will redirect.
  // This prevents rendering anything further for a logged-out user.
  if (!user) {
    return null;
  }

  // Only require email verification for users who signed up with an email/password
  const providerId = user?.providerData?.[0]?.providerId;
  const requiresVerification = providerId === 'password' && !!user?.email;

  if (requiresVerification && !user.emailVerified) {
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

  // If the user's profile document does NOT exist, they need to do onboarding.
  if (user && !userProfile) {
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
  
  // Fallback case (should not be reached)
  return null;
}
