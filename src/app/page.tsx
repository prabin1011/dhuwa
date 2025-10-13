'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { WelcomeIllustration } from '@/components/illustrations/welcome';

export default function HomePage() {
  const { user, isUserLoading } = useUser();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex flex-col items-center mb-8 flex-1 justify-center pb-20">
        <WelcomeIllustration className="w-48 h-48" />
        <h1 className="text-4xl font-bold mt-4 font-heading">Welcome to Dhuwa</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          A mindful companion to help you understand your habits, find your balance, and reclaim your freedom.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
            {isUserLoading ? (
            <Button size="lg" disabled>Loading…</Button>
            ) : user ? (
            <Button asChild size="lg"><Link href="/dashboard">Continue to Dashboard</Link></Button>
            ) : (
            <Button asChild size="lg"><Link href="/login">Login or Sign Up</Link></Button>
            )}
        </div>
      </div>

      <footer className="absolute bottom-8 text-xs text-muted-foreground">
        <Link href="/about" className="hover:underline">About</Link> · <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
