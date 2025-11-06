'use client';

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import type {Locale} from '@/i18n';
import {useUser, useAuthActions} from '@/firebase';
import {useTranslations} from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WelcomeIllustration } from '@/components/illustrations/welcome';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const {locale} = useParams() as {locale: Locale};
  const {user, isUserLoading} = useUser();
  const {signInWithEmail, signUpWithEmail, sendPasswordReset} = useAuthActions();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');


  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace(`/${locale}/dashboard`);
    }
  }, [user, isUserLoading, router, locale]);

  const handleAuthAction = async (e: React.FormEvent, action: 'signin' | 'signup') => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (action === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, username);
      }
      toast({ title: "Success!", description: "Redirecting you to the dashboard..." });
      // The useEffect hook will handle the redirect
    } catch (error: any) {
        let message = "An unexpected error occurred. Please try again.";
        if (error.code) {
            switch(error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    message = "Invalid email or password. Please try again.";
                    break;
                case 'auth/email-already-in-use':
                    message = "An account with this email already exists. Please sign in.";
                    setActiveTab('signin');
                    break;
                case 'auth/weak-password':
                    message = "The password is too weak. Please use at least 6 characters.";
                    break;
                default:
                    message = error.message;
            }
        }
      toast({ variant: 'destructive', title: "Authentication Failed", description: message });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email address to reset your password.' });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      toast({ title: 'Password Reset Email Sent', description: 'Please check your inbox for instructions.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Reset Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }


  if (isUserLoading || user) {
    return <div className="grid place-items-center h-screen"><WelcomeIllustration /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
            <div className="text-center mb-8">
                 <WelcomeIllustration className="mx-auto" />
                 <h1 className="text-2xl font-bold mt-4">Welcome to Dhuwa</h1>
                 <p className="text-muted-foreground">Let's begin your journey to a smoke-free life.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                    <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                    <form onSubmit={(e) => handleAuthAction(e, 'signin')} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-signin">Email</Label>
                            <Input id="email-signin" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-signin">Password</Label>
                            <Input id="password-signin" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Signing In..." : t('auth.signIn')}</Button>
                        <Button variant="link" type="button" className="w-full text-xs" onClick={handlePasswordReset}>Forgot Password?</Button>
                    </form>
                </TabsContent>
                <TabsContent value="signup">
                    <form onSubmit={(e) => handleAuthAction(e, 'signup')} className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="username-signup">Username</Label>
                            <Input id="username-signup" type="text" placeholder="Your Name" required value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email-signup">Email</Label>
                            <Input id="email-signup" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-signup">Password</Label>
                            <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Creating Account..." : t('auth.signUp')}</Button>
                    </form>
                </TabsContent>
            </Tabs>
             <p className="px-8 text-center text-xs text-muted-foreground mt-6">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
                </Link>
                .
            </p>
        </div>
    </div>
  );
}
