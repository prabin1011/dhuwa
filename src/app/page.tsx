'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useAuthActions } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { WelcomeIllustration } from '@/components/illustrations/welcome';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuthActions();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Redirect if already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Show a loading state ONLY while checking auth status.
  if (isUserLoading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }
  
  // If user is logged in, useEffect handles redirect, so we render nothing to prevent flashes of content.
  if (user) {
    return null;
  }
  
  const onSignIn = async (form: FormData) => {
    setLoading(true);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    try {
      await signInWithEmail(email, password);
      router.replace('/dashboard');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: e?.message ?? 'Check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (form: FormData) => {
    setLoading(true);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirm') || '');
    const username = String(form.get('username') || '').trim();

    if (!username) {
        toast({ variant: 'destructive', title: 'Username Required' });
        setLoading(false);
        return;
    }

    if (password.length < 8) {
      toast({ variant: 'destructive', title: 'Weak Password', description: 'Use at least 8 characters.' });
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Password Mismatch', description: 'Passwords must match.' });
      setLoading(false);
      return;
    }
    try {
      await signUpWithEmail(email, password, username);
      toast({ title: 'Account Created', description: 'Please check your email for a verification link.' });
      router.replace('/dashboard');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sign Up Failed', description: e?.message ?? 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    const resetEmailInput = document.getElementById('reset-email') as HTMLInputElement | null;
    const email = resetEmailInput?.value.trim();

    if (!email) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email address.' });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      toast({ title: 'Password Reset Email Sent', description: 'Please check your inbox for instructions.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message ?? 'Could not send reset email.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center text-center mb-8">
            <Link href="/">
                <WelcomeIllustration className="w-40 h-40" />
            </Link>
            <h1 className="text-3xl font-bold mt-4 font-heading">Welcome to Dhuwa</h1>
            <p className="text-muted-foreground mt-1 max-w-md">A mindful companion to help you understand your habits, find your balance, and reclaim your freedom.</p>
        </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="space-y-4">
            <form action={onSignIn} className="space-y-3">
              <div>
                <Label htmlFor="email">Email or Username</Label>
                <Input id="email" name="email" type="text" required />
              </div>
              <div>
                <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="link" className="p-0 h-auto text-xs text-muted-foreground">Forgot Password?</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Enter the email address associated with your account, and we'll send you a link to reset your password.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-2">
                                <Label htmlFor="reset-email" className="sr-only">Email</Label>
                                <Input id="reset-email" name="reset-email" type="email" placeholder="your.email@example.com" />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePasswordReset}>Send Reset Link</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
        </TabsContent>
        <TabsContent value="signup" className="space-y-4">
            <form action={onSignUp} className="space-y-3">
              <div>
                <Label htmlFor="username-su">Username</Label>
                <Input id="username-su" name="username" type="text" required />
              </div>
              <div>
                <Label htmlFor="email-su">Email</Label>
                <Input id="email-su" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="password-su">Password</Label>
                <Input id="password-su" name="password" type="password" required />
              </div>
              <div>
                <Label htmlFor="confirm-su">Confirm Password</Label>
                <Input id="confirm-su" name="confirm" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
        </TabsContent>
      </Tabs>
      <footer className="absolute bottom-8 text-xs text-muted-foreground">
            <Link href="/about" className="hover:underline">About</Link> &middot; <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
