'use client';

import { useState, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Cigarette, Leaf } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

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

type Step = {
  id: number;
  title: string;
  field: keyof OnboardingData;
  question: string;
  type: 'checkbox' | 'radio' | 'number' | 'summary';
  options?: { value: string; label: string; description?: string }[];
  optional?: boolean;
};


// Constants
const STEPS: Step[] = [
    { id: 1, title: 'The Habit', field: 'habits', question: 'What do you currently use?', type: 'checkbox', options: [{value: 'Cigarettes', label: 'Cigarettes'}, {value: 'Weed', label: 'Weed'}] },
    { id: 2, title: 'The Habit', field: 'frequency', question: 'How often do you smoke?', type: 'radio', options: [
        {value: 'daily', label: 'Every day'},
        {value: 'few-times-week', label: 'A few times a week'},
        {value: 'weekly', label: 'Once a week'},
        {value: 'occasionally', label: 'Occasionally'},
    ]},
    { id: 3, title: 'The Habit', field: 'started', question: 'When did you start smoking?', type: 'radio', options: [
        {value: 'less-6-months', label: 'Less than 6 months ago'},
        {value: '6-12-months', label: '6 months - 1 year ago'},
        {value: '1-3-years', label: '1–3 years ago'},
        {value: '3-5-years', label: '3–5 years ago'},
        {value: 'over-5-years', label: 'Over 5 years ago'},
    ]},
    { id: 4, title: 'The Cost', field: 'packCost', question: 'What is the average cost of a pack or unit?', type: 'number'},
    { id: 5, title: 'The Cost', field: 'itemsPerPack', question: 'How many items are in one pack/unit?', type: 'number'},
    { id: 6, title: 'The Cost', field: 'singleCost', question: 'If you buy singles, how much do you pay? (optional)', type: 'number', optional: true},
    { id: 7, title: 'The Cost', field: 'itemsPerDay', question: 'On average, how many do you consume per day?', type: 'radio', options: [
        {value: '1-5', label: '1-5'},
        {value: '6-10', label: '6-10'},
        {value: '11-15', label: '11-15'},
        {value: '16-20', label: '16-20'},
        {value: '20+', label: 'More than 20'},
    ]},
    { id: 8, title: 'Your Goal', field: 'goal', question: 'What’s your primary goal right now?', type: 'radio', options: [
        {value: 'quit', label: 'Quit completely'},
        {value: 'reduce', label: 'Cut down gradually'},
        {value: 'track', label: 'Just track and understand my habits'},
    ]},
    { id: 9, title: 'Your Goal', field: 'motivation', question: 'What motivates you most?', type: 'radio', options: [
        {value: 'health', label: 'Health and energy'},
        {value: 'money', label: 'Saving money'},
        {value: 'family', label: 'Family or relationships'},
        {value: 'focus', label: 'Focus and productivity'},
        {value: 'peace', label: 'Mental peace'},
    ]},
    { id: 10, title: 'Your Goal', field: 'confidence', question: 'How confident are you that you can achieve this goal?', type: 'radio', options: [
        {value: 'very-confident', label: 'Very confident'},
        {value: 'somewhat-confident', label: 'Somewhat confident'},
        {value: 'not-sure', label: 'Not sure'},
        {value: 'observing', label: 'I just want to observe for now'},
    ]},
    { id: 11, title: 'Routine & Timing', field: 'cravingTime', question: 'When do you usually smoke the most?', type: 'radio', options: [
        {value: 'morning', label: 'Morning'},
        {value: 'afternoon', label: 'Afternoon'},
        {value: 'evening', label: 'Evening'},
        {value: 'late-night', label: 'Late night'},
    ]},
    { id: 12, title: 'Routine & Timing', field: 'breakDuration', question: 'How long does a typical smoke break last?', type: 'radio', options: [
        {value: 'less-5-min', label: 'Less than 5 minutes'},
        {value: '5-10-min', label: '5–10 minutes'},
        {value: '10-20-min', label: '10–20 minutes'},
        {value: 'more-20-min', label: 'More than 20 minutes'},
    ]},
    { id: 13, title: 'Routine & Timing', field: 'usualPlace', question: 'Where do you usually smoke?', type: 'radio', options: [
        {value: 'home', label: 'Home'},
        {value: 'work', label: 'Work/School'},
        {value: 'bar', label: 'Bar/Café'},
        {value: 'outside', label: 'Outside/Public'},
        {value: 'other', label: 'Other'},
    ]},
    { id: 14, title: 'Routine & Timing', field: 'usualCompany', question: 'Who are you usually with?', type: 'radio', options: [
        {value: 'alone', label: 'Alone'},
        {value: 'friends', label: 'Friends'},
        {value: 'colleagues', label: 'Colleagues'},
        {value: 'partner', label: 'Partner'},
        {value: 'strangers', label: 'Strangers'},
    ]},
    { id: 15, title: 'Moods & Triggers', field: 'moodBefore', question: 'What do you usually feel before smoking?', type: 'radio', options: [
        {value: 'stressed', label: 'Stressed'},
        {value: 'bored', label: 'Bored'},
        {value: 'lonely', label: 'Lonely'},
        {value: 'happy', label: 'Happy'},
        {value: 'tired', label: 'Tired'},
        {value: 'anxious', label: 'Anxious'},
        {value: 'neutral', label: 'Neutral'},
    ]},
    { id: 16, title: 'Moods & Triggers', field: 'mainTrigger', question: 'What’s the biggest reason you light up?', type: 'radio', options: [
        {value: 'relax', label: 'To relax'},
        {value: 'socialize', label: 'To socialize'},
        {value: 'habit', label: 'Out of habit'},
        {value: 'focus', label: 'To focus'},
        {value: 'cope', label: 'To cope with stress'},
        {value: 'celebrate', label: 'To celebrate'},
    ]},
    { id: 17, title: 'Moods & Triggers', field: 'moodAfter', question: 'How do you usually feel afterward?', type: 'radio', options: [
        {value: 'calm', label: 'Calm'},
        {value: 'guilty', label: 'Guilty'},
        {value: 'energized', label: 'Energized'},
        {value: 'sleepy', label: 'Sleepy'},
        {value: 'same', label: 'The same'},
    ]},
    { id: 18, title: 'Moods & Triggers', field: 'cravingStrength', question: 'How strong are your cravings usually?', type: 'radio', options: [
        {value: 'very-strong', label: 'Very strong'},
        {value: 'moderate', label: 'Moderate'},
        {value: 'mild', label: 'Mild'},
        {value: 'rarely', label: 'Rarely crave'},
    ]},
    { id: 19, title: 'Health & Awareness', field: 'healthEffects', question: 'Have you noticed any health effects recently?', type: 'radio', options: [
        {value: 'cough', label: 'Cough or breath issues'},
        {value: 'sleep', label: 'Poor sleep'},
        {value: 'anxiety', label: 'Anxiety or mood swings'},
        {value: 'energy', label: 'Low energy'},
        {value: 'none', label: 'None noticeable'},
    ]},
    { id: 20, title: 'Health & Awareness', field: 'exerciseFrequency', question: 'How often do you exercise?', type: 'radio', options: [
        {value: 'daily', label: 'Daily'},
        {value: '2-3-week', label: '2–3 times a week'},
        {value: 'weekly', label: 'Once a week'},
        {value: 'rarely', label: 'Rarely'},
    ]},
    { id: 21, title: 'Health & Awareness', field: 'sleepDuration', question: 'How much sleep do you get daily?', type: 'radio', options: [
        {value: 'less-5', label: 'Less than 5 hours'},
        {value: '5-7', label: '5–7 hours'},
        {value: '7-9', label: '7–9 hours'},
        {value: 'more-9', label: 'More than 9 hours'},
    ]},
    { id: 22, title: 'Health & Awareness', field: 'stressFrequency', question: 'How often do you feel stressed?', type: 'radio', options: [
        {value: 'very-often', label: 'Very often'},
        {value: 'sometimes', label: 'Sometimes'},
        {value: 'rarely', label: 'Rarely'},
        {value: 'almost-never', label: 'Almost never'},
    ]},
    { id: 23, title: 'Reflection Setup', field: 'checkInTime', question: 'When would you prefer daily or weekly check-ins?', type: 'radio', options: [
        {value: 'morning', label: 'Morning'},
        {value: 'afternoon', label: 'Afternoon'},
        {value: 'evening', label: 'Evening'},
        {value: 'night', label: 'Night'},
    ]},
    { id: 24, title: 'Reflection Setup', field: 'preferredTone', question: 'What kind of support tone do you prefer from the AI?', type: 'radio', options: [
        {value: 'friendly', label: 'Friendly'},
        {value: 'mindful', label: 'Calm and mindful'},
        {value: 'coach', label: 'Strict coach'},
        {value: 'buddy', label: 'Casual buddy'},
    ]},
    { id: 25, title: 'Reflection Setup', field: 'reminders', question: 'Would you like the app to send motivational reminders?', type: 'radio', options: [
        {value: 'daily', label: 'Yes, daily'},
        {value: 'weekly', label: 'Yes, weekly'},
        {value: 'slipping', label: 'Only when I’m slipping'},
        {value: 'no', label: 'No reminders please'},
    ]},
  { id: 26, title: 'Summary', field: 'habits', question: 'Summary', type: 'summary'},
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
    <RadioGroup value={value} onValueChange={onValueChange} className="grid grid-cols-1 gap-3">
        {items.map(item => (
            <Label key={item.value} htmlFor={`${name}-${item.value}`} className={cn("flex items-center space-x-3 rounded-md border-2 border-secondary bg-secondary/50 p-4 cursor-pointer hover:border-primary transition-colors", value === item.value && 'border-primary ring-2 ring-primary bg-primary/10')}>
                <RadioGroupItem value={item.value} id={`${name}-${item.value}`} />
                <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
            </Label>
        ))}
    </RadioGroup>
);

const NumberKeypad = ({ value, onValueChange }: { value: string, onValueChange: (v: string) => void }) => {
    const handleKeyPress = (key: string) => {
        if (key === 'backspace') {
            onValueChange(value.slice(0, -1));
        } else if (key === '.' && value.includes('.')) {
            return;
        } else if (value.length < 6) {
            onValueChange(value + key);
        }
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

    return (
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
            {keys.map(key => (
                <Button key={key} variant="outline" size="lg" className="h-16 text-2xl" onClick={() => handleKeyPress(key)}>{key}</Button>
            ))}
            <Button variant="outline" size="lg" className="h-16 text-2xl" onClick={() => handleKeyPress('backspace')}>&larr;</Button>
        </div>
    );
};

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
    if (!stepConfig || stepConfig.type === 'summary' || stepConfig.optional) return true;

    const value = formData[stepConfig.field];

    if (Array.isArray(value)) {
        if (value.length === 0) {
             toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select at least one option.' });
             return false;
        }
    } else if (typeof value === 'string') {
        if (!value.trim()) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out this field.' });
            return false;
        }
    }
    
    if (stepConfig.type === 'number') {
        const numValue = parseFloat(value as string);
        if (isNaN(numValue) || numValue <= 0) {
             toast({ variant: 'destructive', title: 'Invalid Number', description: `Please enter a valid, positive number.` });
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
    
    try {
        await setDoc(profileRef, profileData, { merge: true });
        toast({
          title: 'Profile Saved!',
          description: "You're all set. Let's get started!",
        });
    } catch (error: any) {
        console.error("Error saving profile:", error);
        toast({
          variant: 'destructive',
          title: 'Save Error',
          description: 'Could not save your profile. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const getSummaryValue = (key: keyof OnboardingData) => {
    const value = formData[key];
    if (Array.isArray(value)) return value.join(', ');
    const step = STEPS.find(s => s.field === key);
    if (step?.type === 'radio' && step.options) {
        return step.options.find(o => o.value === value)?.label || value;
    }
    return value || 'Not set';
  }
  
  const currentStepConfig = STEPS[currentStep - 1];

  const renderProgressDots = () => {
    return (
        <div className="flex justify-center items-center gap-2">
            {STEPS.map(step => (
                <div key={step.id} className={cn("w-2 h-2 rounded-full transition-all", currentStep === step.id ? "p-1.5 bg-primary" : "bg-secondary/50", currentStep > step.id ? "bg-primary/50" : "bg-secondary/50")}></div>
            ))}
        </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
       <header className="p-4 flex items-center justify-between">
            {currentStep > 1 ? (
                 <Button variant="ghost" size="icon" onClick={prevStep} disabled={isSubmitting}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            ) : <div className='w-10'></div>}
            <div className="text-sm font-bold text-primary">{currentStep} / {STEPS.length}</div>
       </header>

       <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-xl md:text-2xl font-bold max-w-lg mb-10">
                {currentStepConfig.question}
            </h1>
            <div className="w-full max-w-md">
                {currentStepConfig.type === 'checkbox' && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {(currentStepConfig.options || []).map(habit => (
                            <Label key={habit.value} htmlFor={`habit-${habit.value}`} className={cn("flex flex-col items-center justify-center gap-2 rounded-md border-2 border-secondary bg-secondary/50 p-6 cursor-pointer hover:border-primary transition-colors", formData.habits.includes(habit.value) && 'border-primary ring-2 ring-primary bg-primary/10')}>
                                 <Checkbox id={`habit-${habit.value}`} checked={formData.habits.includes(habit.value)} onCheckedChange={() => handleHabitChange(habit.value)} className="sr-only" />
                                 {habit.value === 'Cigarettes' && <Cigarette className="w-8 h-8" />}
                                 {habit.value === 'Weed' && <Leaf className="w-8 h-8" />}
                                 <span className="font-medium text-sm">{habit.label}</span>
                            </Label>
                       ))}
                    </div>
                )}
                 {currentStepConfig.type === 'radio' && (
                    <QuestionRadioGroup 
                        name={currentStepConfig.field} 
                        value={formData[currentStepConfig.field] as string} 
                        onValueChange={(v) => {
                            handleChange(currentStepConfig.field, v);
                            setTimeout(nextStep, 200);
                        }} 
                        items={currentStepConfig.options || []}
                    />
                 )}
                 {currentStepConfig.type === 'number' && (
                     <div className='flex flex-col items-center gap-8'>
                        <div className="text-3xl font-bold">
                            <span className="text-muted-foreground">$</span>
                            {formData[currentStepConfig.field] || '0'}
                            <span className="animate-pulse">|</span>
                        </div>
                        <NumberKeypad value={formData[currentStepConfig.field] as string} onValueChange={(v) => handleChange(currentStepConfig.field, v)} />
                     </div>
                 )}
                 {currentStepConfig.type === 'summary' && (
                    <div className="space-y-4 text-left max-w-md mx-auto">
                        <h3 className="text-lg font-bold text-center">Your Baseline</h3>
                        <p className="text-muted-foreground text-center text-xs">You're all set. Hit finish to jump into your personalized dashboard and begin.</p>
                        <div className="bg-secondary/50 rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <p><strong>Habits:</strong> {getSummaryValue('habits')}</p>
                            <p><strong>Goal:</strong> <span className="capitalize">{getSummaryValue('goal')}</span></p>
                            <p><strong>Daily Avg:</strong> {getSummaryValue('itemsPerDay')}</p>
                            <p><strong>Main Trigger:</strong> <span className="capitalize">{getSummaryValue('mainTrigger')}</span></p>
                            <p><strong>Motivation:</strong> <span className="capitalize">{getSummaryValue('motivation')}</span></p>
                            <p><strong>Check-in:</strong> <span className="capitalize">{getSummaryValue('checkInTime')}</span></p>
                        </div>
                    </div>
                 )}
            </div>
       </main>
       
        <footer className="p-6 space-y-6">
            {renderProgressDots()}
            {currentStep < STEPS.length ? (
            <Button size="lg" className="w-full h-14 text-lg" onClick={nextStep} disabled={isSubmitting}>
              Next
            </Button>
          ) : (
            <Button size="lg" className="w-full h-14 text-lg" onClick={handleCompleteOnboarding} disabled={isSubmitting}>
             {isSubmitting ? 'Saving...' : 'Finish Setup'} <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </footer>
    </div>
  );
}
