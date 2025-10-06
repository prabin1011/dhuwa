
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { WelcomeIllustration } from '@/components/illustrations/welcome';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullLogin, setShowFullLogin] = useState(false);

  useEffect(() => {
    // If we have a user who is NOT anonymous, they have a full account, redirect to home.
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push('/');
    }
    // Anonymous users might want to upgrade, so we let them stay.
  }, [user, isUserLoading, router]);
  
  // If we are checking for a user, or if a full user (not anon) is already here, show loading.
  if (isUserLoading || (user && !user.isAnonymous)) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  const handleAuthAction = async (action: 'login' | 'signup') => {
    if (!auth || !firestore) return;

    // For sign-up, check if there's a username.
    // If it's an anonymous user upgrading, their username is in user.displayName.
    // If it's a brand new user, their username is in the `username` state.
    const effectiveUsername = user?.isAnonymous ? user.displayName : username;

    if (action === 'signup' && !effectiveUsername?.trim()) {
        toast({
            variant: 'destructive',
            title: 'Username Required',
            description: 'Please enter a username to sign up.',
        });
        return;
    }

    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter both email and password.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Check if there's an existing anonymous user trying to sign up
      if (action === 'signup' && auth.currentUser && auth.currentUser.isAnonymous) {
        // LINK anonymous account to the new email/password
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        
        // The display name is already set, but we can ensure the Firestore doc is updated if needed.
        const userDocRef = doc(firestore, `users/${auth.currentUser.uid}`);
        await setDoc(userDocRef, {
            username: effectiveUsername, // Use the already existing username
        }, { merge: true });
        
        toast({ title: 'Account Upgraded!', description: `Your progress is now saved to ${email}.` });

      } else if (action === 'signup') {
        // Standard new user sign-up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: effectiveUsername });
        const userDocRef = doc(firestore, `users/${newUser.uid}`);
        await setDoc(userDocRef, {
            username: effectiveUsername,
            createdAt: serverTimestamp()
        }, { merge: true });
        toast({ title: 'Success', description: 'Your account has been created.' });
      } else {
        // Standard login
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Welcome Back!', description: `Successfully logged in.` });
      }
      
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!auth || !firestore) return;
    if (!username.trim()) {
        toast({
            variant: 'destructive',
            title: 'Username Required',
            description: 'Please enter a username to continue.',
        });
        return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      const userDocRef = doc(firestore, `users/${user.uid}`);
      await setDoc(userDocRef, {
        username: username,
        createdAt: serverTimestamp()
      }, { merge: true });

      toast({ title: 'Welcome!', description: 'You can explore the app as a guest.' });
      router.push('/');
    } catch (error: any) {
      console.error("Anonymous sign-in error:", error);
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const currentUsername = user?.displayName || username;

  // Decide what to show: the guest intro or the full login/signup form
  if (!showFullLogin) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="flex-1 flex flex-col justify-center items-center">
            <WelcomeIllustration className="w-64 h-64" />
            <h1 className="text-3xl font-bold mt-8 font-heading">Welcome to The Easy Way Out</h1>
             <p className="text-muted-foreground mt-2">
              {user?.isAnonymous ? `Continuing as ${user.displayName}.` : 'Start your journey with a guest account.'}
             </p>
        </div>
        <div className="w-full max-w-sm space-y-4">
            {/* Only show username input if there is no user yet */}
            {!user && (
              <Input 
                  type="text"
                  placeholder="Enter a guest username"
                  className="h-14 text-center text-lg"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
              />
            )}
            {/* If anonymous, this button takes them home. If new, it signs them in. */}
            {user?.isAnonymous ? (
              <Button size="lg" className="w-full h-14 text-lg" onClick={() => router.push('/')}>
                Continue Journey
              </Button>
            ) : (
               <Button size="lg" className="w-full h-14 text-lg" onClick={handleAnonymousSignIn} disabled={isSubmitting || !username}>
                {isSubmitting ? 'Starting...' : 'Continue as Guest'}
               </Button>
            )}
            
            <Button size="lg" variant="outline" className="w-full h-14 text-lg" onClick={() => setShowFullLogin(true)} disabled={isSubmitting}>
                {user?.isAnonymous ? 'Save Progress with Email' : 'Sign In with Email'}
            </Button>
        </div>
      </div>
    )
  }


  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4">
      <h1 className="text-4xl font-bold tracking-tighter mb-8 font-heading">
          The Easy Way Out
      </h1>
      <Tabs defaultValue="signup" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Access your dashboard to continue your journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <Input
                  id="email-login"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Password</Label>
                <Input
                  id="password-login"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button
                className="w-full"
                onClick={() => handleAuthAction('login')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>{user?.isAnonymous ? 'Save Your Progress' : 'Sign Up'}</CardTitle>
              <CardDescription>
                {user?.isAnonymous 
                  ? 'Create a permanent account to save your progress and access it on any device.'
                  : 'Create an account to save your progress across devices.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="username-signup">Username</Label>
                <Input
                  id="username-signup"
                  type="text"
                  placeholder="your_username"
                  value={currentUsername}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting || !!user?.isAnonymous}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input
                  id="password-signup"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleAuthAction('signup')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Account'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
       <Button variant="link" className="mt-4" onClick={() => setShowFullLogin(false)}>
        Back to Welcome
      </Button>
    </div>
  );
}

