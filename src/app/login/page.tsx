'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { useAuthActions } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { WelcomeIllustration } from '@/components/illustrations/welcome';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuthActions();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (!isUserLoading && user) router.replace('/dashboard');
  }, [user, isUserLoading, router]);

  if (isUserLoading) return <div className="h-screen w-screen grid place-items-center">Loading…</div>;
  if (user) return null;

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 relative">
      <div className="flex flex-col items-center w-full flex-1 justify-center pb-20">
        <Link href="/" className="mb-8">
            <WelcomeIllustration className="w-40 h-40" />
        </Link>
        <h1 className="text-3xl font-bold font-heading mb-2">Welcome to Dhuwa</h1>
        <p className="text-muted-foreground mb-6">Sign in or create your account</p>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full max-w-sm">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
            <form
                className="space-y-3 mt-4"
                onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                try {
                    await signInWithEmail(
                    String(fd.get('email') || '').trim(),
                    String(fd.get('password') || '')
                    );
                    router.replace('/dashboard');
                } catch (e: any) {
                    toast({ variant: 'destructive', title: 'Login failed', description: e?.message ?? 'Check your credentials.' });
                } finally {
                    setLoading(false);
                }
                }}
            >
                <div>
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" required />
                </div>
                <div>
                <Label htmlFor="login-pass" className="mt-2">Password</Label>
                <Input id="login-pass" name="password" type="password" required />
                </div>
                <div className="flex justify-end pt-1">
                <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={async () => {
                    const email = prompt('Enter your email for reset:')?.trim();
                    if (!email) return;
                    setLoading(true);
                    try {
                        await sendPasswordReset(email);
                        toast({ title: 'Reset email sent', description: 'Check your inbox.' });
                    } catch (e: any) {
                        toast({ variant: 'destructive', title: 'Reset failed', description: e?.message ?? 'Try again.' });
                    } finally {
                        setLoading(false);
                    }
                    }}
                >
                    Forgot password?
                </button>
                </div>
                <Button type="submit" className="w-full !mt-6" disabled={loading}>{loading ? 'Please wait…' : 'Sign In'}</Button>
            </form>
            </TabsContent>

            <TabsContent value="signup">
            <form
                className="space-y-3 mt-4"
                onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const email = String(fd.get('email') || '').trim();
                const password = String(fd.get('password') || '');
                const confirm = String(fd.get('confirm') || '');
                const username = String(fd.get('username') || '').trim();

                if (password.length < 8) {
                    toast({ variant: 'destructive', title: 'Weak password', description: 'Use at least 8 characters.' });
                    setLoading(false);
                    return;
                }
                if (password !== confirm) {
                    toast({ variant: 'destructive', title: 'Passwords do not match' });
                    setLoading(false);
                    return;
                }

                try {
                    await signUpWithEmail(email, password, username || undefined);
                    toast({ title: 'Account created!', description: "You're now logged in."});
                    router.replace('/dashboard');
                } catch (e: any) {
                    toast({ variant: 'destructive', title: 'Sign up failed', description: e?.message ?? 'Try again.' });
                } finally {
                    setLoading(false);
                }
                }}
            >
                <div>
                    <Label htmlFor="su-username">Username</Label>
                    <Input id="su-username" name="username" type="text" />
                </div>
                <div>
                    <Label htmlFor="su-email" className="mt-2">Email</Label>
                    <Input id="su-email" name="email" type="email" required />
                </div>
                <div>
                    <Label htmlFor="su-pass" className="mt-2">Password</Label>
                    <Input id="su-pass" name="password" type="password" required />
                </div>
                <div>
                    <Label htmlFor="su-confirm" className="mt-2">Confirm Password</Label>
                    <Input id="su-confirm" name="confirm" type="password" required />
                </div>
                <Button type="submit" className="w-full !mt-6" disabled={loading}>{loading ? 'Please wait…' : 'Create Account'}</Button>
            </form>
            </TabsContent>
        </Tabs>
      </div>

      <footer className="absolute bottom-8 text-xs text-muted-foreground">
        <Link href="/about" className="hover:underline">About</Link> · <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
