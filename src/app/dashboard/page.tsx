'use client';

import { useUser, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dashboard } from '@/components/dashboard/dashboard';
import { Onboarding } from '@/components/onboarding/onboarding';
import { useAuthActions, useFirestore, useDoc } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { signOut } = useAuthActions();
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  // This is the correct path for the user profile data.
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

  // Only require email verification for users who signed up with an email/password
  const providerId = user?.providerData?.[0]?.providerId;
  const requiresVerification = providerId === 'password' && !!user?.email;

  useEffect(() => {
    if (requiresVerification && user && !user.emailVerified) {
      setShowVerificationBanner(true);
    } else {
      setShowVerificationBanner(false);
    }
  }, [requiresVerification, user]);
  
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

  // If the user's profile document does NOT exist OR is incomplete, they need to do onboarding.
  if (user && (!userProfile || !userProfile.goal)) {
    return <Onboarding />;
  }

  // If user is logged in and has a full profile, show the dashboard.
  if (user && userProfile) {
    return (
      <>
       {showVerificationBanner && (
         <div className='w-full p-4 fixed top-0 z-50 bg-background/80 backdrop-blur-sm'>
            <Alert variant="default" className="max-w-md mx-auto relative pr-10">
                <AlertTitle>Verify Your Email</AlertTitle>
                <AlertDescription>
                    Please check your inbox for a verification link to unlock all features.
                </AlertDescription>
                <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={handleResendVerification}>Resend Email</Button>
                </div>
                 <button
                    onClick={() => setShowVerificationBanner(false)}
                    className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:bg-secondary"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </Alert>
         </div>
       )}
        <div className="h-screen w-screen bg-background">
          <Dashboard user={user} userProfile={{...userProfile, id: user.uid}} />
        </div>
      </>
    );
  }
  
  // Fallback case (should not be reached)
  return null;
}
