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
import { ArrowLeft, ArrowRight, Cigarette, Check } from 'lucide-react';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';

type OnboardingData = {
  habitName: string;
  itemsPerDay: string;
  packCost: string;
  itemsPerPack: string;
  goal: 'quit' | 'reduce' | 'track' | '';
};

const STEPS = [
  { id: 1, title: 'Your Habit', fields: ['habitName', 'itemsPerDay'] },
  { id: 2, title: 'The Cost', fields: ['packCost', 'itemsPerPack'] },
  { id: 3, title: 'Your Goal', fields: ['goal'] },
  { id: 4, title: 'Summary' },
];

export function Onboarding() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    habitName: 'Cigarette',
    itemsPerDay: '',
    packCost: '',
    itemsPerPack: '',
    goal: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleGoalChange = (value: 'quit' | 'reduce' | 'track') => {
    setFormData(prev => ({...prev, goal: value}));
  }

  const validateStep = () => {
    const currentFields = STEPS.find(s => s.id === currentStep)?.fields;
    if (!currentFields) return true;

    for (const field of currentFields) {
        const key = field as keyof OnboardingData;
        const value = formData[key];

        if (typeof value === 'string' && !value.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return false;
        }

        if (key === 'itemsPerDay' || key === 'packCost' || key === 'itemsPerPack') {
            const numValue = parseFloat(value as string);
            if (isNaN(numValue) || numValue <= 0) {
                 toast({ variant: 'destructive', title: 'Invalid Number', description: `Please enter a valid, positive number for ${field}.` });
                 return false;
            }
        }
        
        if (key === 'goal' && !value) {
             toast({ variant: 'destructive', title: 'Select a Goal', description: 'Please choose one of the options.' });
             return false;
        }
    }
    return true;
  }

  const nextStep = () => {
    if(validateStep()){
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }

  const handleCompleteOnboarding = async () => {
    if (!validateStep()) return;

    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to complete this step.',
      });
      return;
    }

    setIsSubmitting(true);
    
    const profileData = {
        habitName: formData.habitName,
        itemsPerDay: parseInt(formData.itemsPerDay, 10),
        packCost: parseFloat(formData.packCost),
        itemsPerPack: parseInt(formData.itemsPerPack, 10),
        goal: formData.goal,
    };
    
    const profileRef = doc(firestore, `users/${user.uid}/profile/main`);

    try {
       setDocumentNonBlocking(profileRef, profileData, { merge: true });
       
       toast({
        title: 'Profile Saved!',
        description: "You're all set up. Let's get started!",
      });
      // The main page will automatically show the dashboard now
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

  const progress = (currentStep / STEPS.length) * 100;

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
          <CardTitle>
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            Just a few questions to personalize your experience.
          </CardDescription>
           <Progress value={progress} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 min-h-[220px]">
            {currentStep === 1 && (
                 <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="habitName">What habit are you tracking?</Label>
                        <Input id="habitName" placeholder="e.g., Cigarettes, Vaping" value={formData.habitName} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="itemsPerDay">On average, how many do you smoke per day?</Label>
                        <Input id="itemsPerDay" type="number" placeholder="e.g., 10" value={formData.itemsPerDay} onChange={handleChange} />
                    </div>
                 </div>
            )}
             {currentStep === 2 && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="packCost">What is the average cost of a pack?</Label>
                        <Input id="packCost" type="number" placeholder="e.g., 15.50" value={formData.packCost} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="itemsPerPack">How many items are in a pack?</Label>
                        <Input id="itemsPerPack" type="number" placeholder="e.g., 20" value={formData.itemsPerPack} onChange={handleChange} />
                    </div>
                </div>
            )}
            {currentStep === 3 && (
                <div className="space-y-4">
                    <Label>What's your primary goal?</Label>
                    <RadioGroup value={formData.goal} onValueChange={handleGoalChange} className="space-y-2">
                        <Label htmlFor="goal-quit" className={cn("flex items-center space-x-2 rounded-md border p-4 cursor-pointer", formData.goal === 'quit' && 'border-primary ring-2 ring-primary')}>
                            <RadioGroupItem value="quit" id="goal-quit" />
                            <div>
                                <p className="font-semibold">Quit Completely</p>
                                <p className="text-sm text-muted-foreground">Aim to stop entirely.</p>
                            </div>
                        </Label>
                         <Label htmlFor="goal-reduce" className={cn("flex items-center space-x-2 rounded-md border p-4 cursor-pointer", formData.goal === 'reduce' && 'border-primary ring-2 ring-primary')}>
                            <RadioGroupItem value="reduce" id="goal-reduce" />
                             <div>
                                <p className="font-semibold">Cut Down</p>
                                <p className="text-sm text-muted-foreground">Reduce the number over time.</p>
                            </div>
                        </Label>
                         <Label htmlFor="goal-track" className={cn("flex items-center space-x-2 rounded-md border p-4 cursor-pointer", formData.goal === 'track' && 'border-primary ring-2 ring-primary')}>
                            <RadioGroupItem value="track" id="goal-track" />
                            <div>
                                <p className="font-semibold">Just Track</p>
                                <p className="text-sm text-muted-foreground">Become more aware of your habits.</p>
                            </div>
                        </Label>
                    </RadioGroup>
                </div>
            )}
             {currentStep === 4 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Ready to start?</h3>
                    <p className="text-muted-foreground">You're all set. Hit the finish button to jump into your personalized dashboard and begin your journey.</p>
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-2">
                             <p><strong>Habit:</strong> {formData.habitName}</p>
                             <p><strong>Daily Average:</strong> {formData.itemsPerDay}</p>
                             <p><strong>Goal:</strong> <span className="capitalize">{formData.goal}</span></p>
                        </CardContent>
                    </Card>
                </div>
            )}

        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep} disabled={isSubmitting}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleCompleteOnboarding} disabled={isSubmitting}>
             {isSubmitting ? 'Saving...' : 'Finish Setup'} <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
