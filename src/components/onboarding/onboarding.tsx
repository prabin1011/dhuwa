'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { Cigarette } from 'lucide-react';

export function Onboarding() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [habitName, setHabitName] = useState('Cigarette');
  const [packCost, setPackCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteOnboarding = async () => {
    const cost = parseFloat(packCost);
    if (!habitName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please tell us what habit you are tracking.',
      });
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Cost',
        description: 'Please enter a valid number for the cost.',
      });
      return;
    }

    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to complete this step.',
      });
      return;
    }

    setIsSubmitting(true);
    
    // We use a fixed ID 'main' to treat this as a singleton document.
    const profileRef = doc(firestore, `users/${user.uid}/profile/main`);

    try {
      // Using non-blocking set. The UI will update on the next render cycle via the main App component.
       setDocumentNonBlocking(profileRef, { habitName, packCost: cost }, { merge: true });
       
       toast({
        title: 'Profile Saved!',
        description: "You're all set up. Let's get started!",
      });
      // No router.push needed, the parent component will handle the re-render
    } catch (error: any) {
        console.error("Onboarding error:", error);
        toast({
            variant: "destructive",
            title: "Something went wrong",
            description: "Could not save your profile. Please try again."
        })
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4">
        <div className='flex items-center gap-4 mb-8'>
            <Cigarette className='w-12 h-12 text-primary'/>
            <h1 className="text-5xl font-bold tracking-tighter font-heading">
                Welcome!
            </h1>
        </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Let's Get Started</CardTitle>
          <CardDescription>
            Just a couple of questions to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="habitName">What habit are you tracking?</Label>
            <Input
              id="habitName"
              placeholder="e.g., Cigarettes, Vaping, etc."
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="packCost">What is the average cost of a pack?</Label>
            <Input
              id="packCost"
              type="number"
              placeholder="e.g., 15.50"
              value={packCost}
              onChange={(e) => setPackCost(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleCompleteOnboarding}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Finish Setup'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
