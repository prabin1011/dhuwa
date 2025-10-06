
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  const handleAuthAction = async (action: 'login' | 'signup') => {
    if (!auth) return;
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
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      toast({ title: 'Success', description: `Successfully ${action === 'login' ? 'logged in' : 'signed up'}.` });
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

      // Update Firebase Auth user profile
      await updateProfile(user, { displayName: username });

      // Create the anonymous user profile document in Firestore
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

  if (!showFullLogin) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-8 text-center">
        <div className="flex-1 flex flex-col justify-center items-center">
            <WelcomeIllustration className="w-64 h-64" />
            <h1 className="text-3xl font-bold mt-8 font-heading">Welcome to The Easy Way Out</h1>
             <p className="text-muted-foreground mt-2">Start your journey with a guest account.</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
            <Input 
                type="text"
                placeholder="Enter a guest username"
                className="h-14 text-center text-lg"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
            />
            <Button size="lg" className="w-full h-14 text-lg" onClick={handleAnonymousSignIn} disabled={isSubmitting}>
                {isSubmitting ? 'Starting...' : 'Continue as Guest'}
            </Button>
            <Button size="lg" variant="outline" className="w-full h-14 text-lg" onClick={() => setShowFullLogin(true)} disabled={isSubmitting}>
                Sign In with Email
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
      <Tabs defaultValue="login" className="w-full max-w-sm">
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
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>
                Create an account to save your progress across devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {isSubmitting ? 'Signing up...' : 'Sign Up'}
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
