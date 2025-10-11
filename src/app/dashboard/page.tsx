
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/provider';
import { Dashboard } from '@/components/dashboard/dashboard';
import { Onboarding } from '@/components/onboarding/onboarding';
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
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);

  // Hooks must be called unconditionally at the top level.
  const ref = useMemoFirebase(() => {
    if (!user) return null; // Handle null user case inside the memo
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile, isLoading } = useDoc(ref);
  
  // If unauthenticated, go to login. No spinner forever.
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);
  
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

  // Now we can have early returns after all hooks are called.
  if (isUserLoading || isLoading) return <div className="h-screen w-screen grid place-items-center">Loading…</div>;
  if (!user) return null;

  // If no profile or not onboarded yet, show onboarding.
  if (!profile || !profile.goal) {
    return <Onboarding />;
  }

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
        <Dashboard user={user} userProfile={{ ...profile, id: user.uid }} />
      </div>
    </>
  );
}
