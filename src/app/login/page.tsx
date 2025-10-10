
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
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
  const [activeTab, setActiveTab] = useState('signup');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const resetForm = () => {
      setEmail('');
      setPassword('');
      setUsername('');
  }

  const handleTabChange = (value: string) => {
      setActiveTab(value);
      resetForm();
  }
  
  if (isUserLoading || user) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  const handleAuthAction = async (action: 'login' | 'signup') => {
    if (!auth || !firestore) return;

    if (action === 'signup' && !username.trim()) {
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
      if (action === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: username });

        // Create the user profile document in Firestore
        const userDocRef = doc(firestore, `users/${newUser.uid}`);
        await setDoc(userDocRef, {
            username: username,
            createdAt: serverTimestamp()
        }, { merge: true }); // Use merge to be safe

        // Send verification email
        await sendEmailVerification(newUser);
        toast({ 
            title: 'Account Created!', 
            description: 'A verification email has been sent. Please verify your email to log in.' 
        });
        // Switch to login tab and clear fields for the user to log in after verifying
        setActiveTab('login');
        resetForm();

      } else {
        // Standard login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
             toast({ 
                variant: 'destructive',
                title: 'Email Not Verified', 
                description: 'Please check your inbox and verify your email address to log in.' 
            });
             await auth.signOut(); // Sign out the user until they are verified
             setIsSubmitting(false);
             return;
        }
        toast({ title: 'Welcome Back!', description: `Successfully logged in.` });
        router.push('/dashboard');
      }
      
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


  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center text-center mb-8">
            <Link href="/">
                <WelcomeIllustration className="w-40 h-40" />
            </Link>
            <h1 className="text-3xl font-bold mt-4 font-heading">Welcome to Dhuwa</h1>
            <p className="text-muted-foreground mt-1">Start your journey to freedom.</p>
        </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-sm">
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
                Create an account to save your progress and start your journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="username-signup">Username</Label>
                <Input
                  id="username-signup"
                  type="text"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
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
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
