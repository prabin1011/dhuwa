'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
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
import { Cigarette } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  const handleAuthAction = async (action: 'login' | 'signup') => {
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
    setIsSubmitting(true);
    try {
      await signInAnonymously(auth);
      toast({ title: 'Welcome!', description: 'You can explore the app as a guest.' });
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


  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4">
        <div className='flex items-center gap-4 mb-8'>
            <Cigarette className='w-12 h-12 text-primary'/>
            <h1 className="text-5xl font-bold tracking-tighter">
                The Easy Way Out
            </h1>
        </div>
        <Card className="w-full max-w-sm mb-4 bg-card">
            <CardHeader className="text-center">
                <CardTitle>Try the App Anonymously</CardTitle>
                <CardDescription>
                Your progress will be saved on this device. You can create an account later.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                 <Button
                    className="w-full"
                    onClick={handleAnonymousSignIn}
                    disabled={isSubmitting}
                    variant="secondary"
                >
                    {isSubmitting ? 'Signing in...' : 'Continue as a Guest'}
                </Button>
            </CardFooter>
        </Card>

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
    </div>
  );
}
