
import { Button } from '@/components/ui/button';
import { WelcomeIllustration } from '@/components/illustrations/welcome';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex flex-col items-center mb-8">
            <WelcomeIllustration className="w-48 h-48" />
            <h1 className="text-4xl font-bold mt-4 font-heading">Welcome to Dhuwa</h1>
            <p className="text-muted-foreground mt-2 max-w-md">
              A mindful companion to help you understand your habits, find your balance, and reclaim your freedom.
            </p>
        </div>

        <div className="space-y-4">
             <p className="text-sm">
                Start your journey to awareness today.
            </p>
            <Button asChild size="lg">
                <Link href="/login">Login or Sign Up</Link>
            </Button>
        </div>

        <footer className="absolute bottom-8 text-xs text-muted-foreground">
            <Link href="/about" className="hover:underline">About</Link> &middot; <Link href="/terms" className="hover:underline">Terms</Link>
        </footer>
    </div>
  );
}
