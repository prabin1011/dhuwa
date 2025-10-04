'use client';

import { useState, useMemo } from 'react';
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
import { ArrowLeft, ArrowRight, Check, Cigarette, Leaf } from 'lucide-react';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

// Data Types
type OnboardingData = {
  habits: string[];
  frequency: string;
  started: string;
  packCost: string;
  itemsPerPack: string;
  singleCost: string;
  itemsPerDay: string;
  goal: string;
  motivation: string;
  confidence: string;
  cravingTime: string;
  breakDuration: string;
  usualPlace: string;
  usualCompany: string;
  moodBefore: string;
  mainTrigger: string;
  moodAfter: string;
  cravingStrength: string;
  healthEffects: string;
  exerciseFrequency: string;
  sleepDuration: string;
  stressFrequency: string;
  checkInTime: string;
  preferredTone: string;
  reminders: string;
};

// Constants
const STEPS = [
    { id: 1, title: 'The Habit', fields: ['habits', 'frequency', 'started'] },
    { id: 2, title: 'The Cost', fields: ['packCost', 'itemsPerPack', 'itemsPerDay'], optionalFields: ['singleCost'] },
    { id: 3, title: 'Your Goal', fields: ['goal', 'motivation', 'confidence'] },
    { id: 4, title: 'Routine & Timing', fields: ['cravingTime', 'breakDuration', 'usualPlace', 'usualCompany'] },
    { id: 5, title: 'Moods & Triggers', fields: ['moodBefore', 'mainTrigger', 'moodAfter', 'cravingStrength'] },
    { id: 6, title: 'Health & Awareness', fields: ['healthEffects', 'exerciseFrequency', 'sleepDuration', 'stressFrequency'] },
    { id: 7, title: 'Reflection Setup', fields: ['checkInTime', 'preferredTone', 'reminders'] },
    { id: 8, title: 'Summary' },
];

const INITIAL_DATA: OnboardingData = {
    habits: [],
    frequency: '',
    started: '',
    packCost: '',
    itemsPerPack: '',
    singleCost: '',
    itemsPerDay: '',
    goal: '',
    motivation: '',
    confidence: '',
    cravingTime: '',
    breakDuration: '',
    usualPlace: '',
    usualCompany: '',
    moodBefore: '',
    mainTrigger: '',
    moodAfter: '',
    cravingStrength: '',
    healthEffects: '',
    exerciseFrequency: '',
    sleepDuration: '',
    stressFrequency: '',
    checkInTime: '',
    preferredTone: '',
    reminders: '',
};

// Helper components
const QuestionRadioGroup = ({ value, onValueChange, items, name }: { value: string, onValueChange: (value: string) => void, items: {value: string, label: string, description?: string}[], name: string }) => (
    <RadioGroup value={value} onValueChange={onValueChange} className="space-y-3">
        {items.map(item => (
            <Label key={item.value} htmlFor={`${name}-${item.value}`} className={cn("flex items-center space-x-3 rounded-md border p-4 cursor-pointer hover:bg-accent/50", value === item.value && 'border-primary ring-2 ring-primary')}>
                <RadioGroupItem value={item.value} id={`${name}-${item.value}`} />
                <div>
                    <p className="font-semibold">{item.label}</p>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                </div>
            </Label>
        ))}
    </RadioGroup>
);

export function Onboarding() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>(INITIAL_DATA);

  const handleChange = (id: keyof OnboardingData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleHabitChange = (habit: string) => {
    const newHabits = formData.habits.includes(habit)
      ? formData.habits.filter(h => h !== habit)
      : [...formData.habits, habit];
    handleChange('habits', newHabits);
  }

  const validateStep = () => {
    const stepConfig = STEPS.find(s => s.id === currentStep);
    if (!stepConfig || !stepConfig.fields) return true;

    const currentFields = stepConfig.fields as (keyof OnboardingData)[];

    for (const field of currentFields) {
        const value = formData[field];
        if (Array.isArray(value) && value.length === 0) {
            toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select at least one option.' });
            return false;
        }
        if (typeof value === 'string' && !value.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return false;
        }
        const numericFields: (keyof OnboardingData)[] = ['packCost', 'itemsPerPack', 'singleCost'];
        if (numericFields.includes(field)) {
            const numValue = parseFloat(value as string);
            if (isNaN(numValue) || numValue <= 0) {
                 toast({ variant: 'destructive', title: 'Invalid Number', description: `Please enter a valid, positive number for this field.` });
                 return false;
            }
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
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to complete this step.' });
      return;
    }
    setIsSubmitting(true);
    
    const profileData = {
      ...formData,
      packCost: parseFloat(formData.packCost) || 0,
      itemsPerPack: parseInt(formData.itemsPerPack, 10) || 0,
      singleCost: parseFloat(formData.singleCost) || 0,
    };
    
    const profileRef = doc(firestore, `users/${user.uid}/profile/main`);
    setDocumentNonBlocking(profileRef, profileData, { merge: true });
   
    toast({
      title: 'Profile Saved!',
      description: "You're all set up. Let's get started!",
    });
    setIsSubmitting(false);
  };

  const progress = (currentStep / STEPS.length) * 100;
  
  const getSummaryValue = (key: keyof OnboardingData) => {
    const value = formData[key];
    if (Array.isArray(value)) return value.join(', ');
    return value || 'Not set';
  }

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-background p-4 py-8">
       <div className='flex items-center gap-4 mb-4 text-center'>
            <Cigarette className='w-10 h-10 text-primary'/>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter font-heading">
                Let's Get to Know You
            </h1>
        </div>
        <p className="text-muted-foreground mb-8 max-w-md text-center">A few questions to personalize your journey. It only takes a minute.</p>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>
              Step {currentStep}: {STEPS[currentStep - 1].title}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{currentStep} of {STEPS.length}</span>
          </div>
           <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent className="min-h-[350px] space-y-6">
            {currentStep === 1 && (
                <div className="space-y-4">
                    <Label>1. What do you currently use? (Select all that apply)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {['Cigarettes', 'Weed'].map(habit => (
                            <Label key={habit} htmlFor={`habit-${habit}`} className={cn("flex flex-col items-center justify-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-accent/50", formData.habits.includes(habit) && 'border-primary ring-2 ring-primary')}>
                                 <Checkbox id={`habit-${habit}`} checked={formData.habits.includes(habit)} onCheckedChange={() => handleHabitChange(habit)} className="sr-only" />
                                 {habit === 'Cigarettes' && <Cigarette className="w-8 h-8" />}
                                 {habit === 'Weed' && <Leaf className="w-8 h-8" />}
                                 <span className="font-semibold">{habit}</span>
                            </Label>
                       ))}
                    </div>
                    <Label>2. How often do you smoke?</Label>
                    <QuestionRadioGroup name="frequency" value={formData.frequency} onValueChange={(v) => handleChange('frequency', v)} items={[
                        {value: 'daily', label: 'Every day'},
                        {value: 'few-times-week', label: 'A few times a week'},
                        {value: 'weekly', label: 'Once a week'},
                        {value: 'occasionally', label: 'Occasionally'},
                    ]}/>
                </div>
            )}
            {currentStep === 2 && (
                <div className="space-y-4">
                    <Label>3. What is the average cost of a pack or unit?</Label>
                    <Input id="packCost" type="number" placeholder="e.g., 15.50" value={formData.packCost} onChange={(e) => handleChange('packCost', e.target.value)} />
                    <Label>4. How many items are in one pack/unit?</Label>
                    <Input id="itemsPerPack" type="number" placeholder="e.g., 20" value={formData.itemsPerPack} onChange={(e) => handleChange('itemsPerPack', e.target.value)} />
                    <Label>5. On average, how many do you consume per day?</Label>
                     <QuestionRadioGroup name="itemsPerDay" value={formData.itemsPerDay} onValueChange={(v) => handleChange('itemsPerDay', v)} items={[
                        {value: '1-5', label: '1-5'},
                        {value: '6-10', label: '6-10'},
                        {value: '11-15', label: '11-15'},
                        {value: '16-20', label: '16-20'},
                        {value: '20+', label: 'More than 20'},
                    ]}/>
                </div>
            )}
            {currentStep === 3 && (
                <div className="space-y-4">
                    <Label>6. What’s your primary goal right now?</Label>
                    <QuestionRadioGroup name="goal" value={formData.goal} onValueChange={(v) => handleChange('goal', v)} items={[
                        {value: 'quit', label: 'Quit completely'},
                        {value: 'reduce', label: 'Cut down gradually'},
                        {value: 'track', label: 'Just track and understand my habits'},
                    ]}/>
                     <Label>7. What motivates you most?</Label>
                     <QuestionRadioGroup name="motivation" value={formData.motivation} onValueChange={(v) => handleChange('motivation', v)} items={[
                        {value: 'health', label: 'Health and energy'},
                        {value: 'money', label: 'Saving money'},
                        {value: 'family', label: 'Family or relationships'},
                        {value: 'focus', label: 'Focus and productivity'},
                    ]}/>
                </div>
            )}
            {currentStep === 4 && (
                 <div className="space-y-4">
                    <Label>8. When do you usually smoke the most?</Label>
                     <QuestionRadioGroup name="cravingTime" value={formData.cravingTime} onValueChange={(v) => handleChange('cravingTime', v)} items={[
                        {value: 'morning', label: 'Morning'},
                        {value: 'afternoon', label: 'Afternoon'},
                        {value: 'evening', label: 'Evening'},
                        {value: 'late-night', label: 'Late night'},
                    ]}/>
                </div>
            )}
            {currentStep === 5 && (
                 <div className="space-y-4">
                    <Label>9. What do you usually feel before smoking?</Label>
                     <QuestionRadioGroup name="moodBefore" value={formData.moodBefore} onValueChange={(v) => handleChange('moodBefore', v)} items={[
                        {value: 'stressed', label: 'Stressed'},
                        {value: 'bored', label: 'Bored'},
                        {value: 'lonely', label: 'Lonely'},
                        {value: 'happy', label: 'Happy'},
                        {value: 'anxious', label: 'Anxious'},
                    ]}/>
                </div>
            )}
            {currentStep === 6 && (
                <div className="space-y-4">
                    <Label>10. Have you noticed any health effects recently?</Label>
                    <QuestionRadioGroup name="healthEffects" value={formData.healthEffects} onValueChange={(v) => handleChange('healthEffects', v)} items={[
                        {value: 'cough', label: 'Cough or breath issues'},
                        {value: 'sleep', label: 'Poor sleep'},
                        {value: 'anxiety', label: 'Anxiety or mood swings'},
                        {value: 'energy', label: 'Low energy'},
                        {value: 'none', label: 'None noticeable'},
                    ]}/>
                </div>
            )}
            {currentStep === 7 && (
                <div className="space-y-4">
                    <Label>11. What kind of support tone do you prefer from the AI?</Label>
                     <QuestionRadioGroup name="preferredTone" value={formData.preferredTone} onValueChange={(v) => handleChange('preferredTone', v)} items={[
                        {value: 'friendly', label: 'Friendly'},
                        {value: 'mindful', label: 'Calm and mindful'},
                        {value: 'coach', label: 'Strict coach'},
                        {value: 'buddy', label: 'Casual buddy'},
                    ]}/>
                </div>
            )}
            {currentStep === 8 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-center">Your Baseline</h3>
                    <p className="text-muted-foreground text-center">You're all set. Hit finish to jump into your personalized dashboard and begin.</p>
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-2">
                             <p><strong>Habits:</strong> {getSummaryValue('habits')}</p>
                             <p><strong>Goal:</strong> <span className="capitalize">{getSummaryValue('goal')}</span></p>
                             <p><strong>Daily Average:</strong> {getSummaryValue('itemsPerDay')}</p>
                             <p><strong>Pack Cost:</strong> ${getSummaryValue('packCost')}</p>
                             <p><strong>Main Trigger:</strong> <span className="capitalize">{getSummaryValue('mainTrigger')}</span></p>
                             <p><strong>Motivation:</strong> <span className="capitalize">{getSummaryValue('motivation')}</span></p>
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
