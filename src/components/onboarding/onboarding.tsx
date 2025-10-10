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
import { ONBOARDING_STEPS, type OnboardingData, type Step } from '@/lib/onboarding-questions';
import { Input } from '../ui/input';
import { useForm, Controller } from 'react-hook-form';


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

const INITIAL_DATA: OnboardingData = {
    habits: [],
    habitDetails: {},
    currency: 'USD',
    frequency: '',
    started: '',
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

export function Onboarding() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { control, watch, setValue, getValues, trigger } = useForm<OnboardingData>({
    defaultValues: INITIAL_DATA
  });

  const formData = watch();

  const handleChange = (id: keyof OnboardingData, value: string | string[] | OnboardingData['habitDetails']) => {
    setValue(id, value as any, { shouldValidate: true, shouldDirty: true });
  };
  
  const handleHabitDetailChange = (habit: string, field: 'packCost' | 'itemsPerPack' | 'itemsPerDay', value: string) => {
    setValue(`habitDetails.${habit}.${field}`, value, { shouldValidate: true, shouldDirty: true });
  }

  const handleHabitChange = (habit: string) => {
    const currentHabits = getValues('habits') || [];
    const newHabits = currentHabits.includes(habit)
      ? currentHabits.filter(h => h !== habit)
      : [...currentHabits, habit];
    handleChange('habits', newHabits);
  }

  const dynamicSteps = useMemo(() => {
    const steps: Step[] = [];
    (formData.habits || []).forEach(habit => {
        steps.push({ id: -1, title: 'The Cost & Amount', field: `habitDetails.${habit}.packCost`, question: `Average cost of a pack of ${habit}?`, type: 'number'});
        steps.push({ id: -2, title: 'The Cost & Amount', field: `habitDetails.${habit}.itemsPerPack`, question: `How many ${habit} in a pack?`, type: 'number' });
        steps.push({ id: -3, title: 'The Cost & Amount', field: `habitDetails.${habit}.itemsPerDay`, question: `Average ${habit} per day?`, type: 'radio', options: [ {value: '1-5', label: '1-5'}, {value: '6-10', label: '6-10'}, {value: '11-15', label: '11-15'}, {value: '16-20', label: '16-20'}, {value: '20+', label: 'More than 20'}, ]});
    });
    return steps;
  }, [formData.habits]);
  
  const allSteps = useMemo(() => {
      const all: Step[] = [];
      ONBOARDING_STEPS.forEach(step => {
          if (step.type === 'dynamic') {
              all.push(...dynamicSteps);
          } else {
              all.push(step);
          }
      });
      // Re-assign IDs
      return all.map((step, index) => ({...step, id: index + 1}));
  }, [dynamicSteps]);


  const validateStep = async () => {
    const stepConfig = allSteps.find(s => s.id === currentStep);
    if (!stepConfig || stepConfig.type === 'summary' || stepConfig.optional) return true;

    const fieldName = stepConfig.field as keyof OnboardingData;
    if (stepConfig.type === 'radio') {
        let value;
        if (typeof stepConfig.field === 'string' && stepConfig.field.startsWith('habitDetails')) {
            const [, habit, field] = stepConfig.field.split('.') as [string, string, keyof OnboardingData['habitDetails'][string]];
            value = getValues(`habitDetails.${habit}.${field}` as any);
        } else {
            value = getValues(stepConfig.field as keyof OnboardingData);
        }
        if (!value) {
            toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select an option.' });
            return false;
        }
        return true;
    }
    const result = await trigger(fieldName as any);
    
    if (!result) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out this field to continue.' });
        return false;
    }
    
    // Additional checks for specific types if needed
    let value: any;
     if (typeof stepConfig.field === 'string' && stepConfig.field.startsWith('habitDetails')) {
        const [, habit, field] = stepConfig.field.split('.') as [string, string, keyof OnboardingData['habitDetails'][string]];
        value = getValues(`habitDetails.${habit}.${field}` as any);
    } else {
        value = getValues(stepConfig.field as keyof OnboardingData);
    }

    if (Array.isArray(value) && value.length === 0) {
        toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select at least one option.' });
        return false;
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

  const nextStep = async () => {
    const isValid = await validateStep();
    if(isValid){
        setCurrentStep(prev => Math.min(prev + 1, allSteps.length));
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
    
    const data = getValues();

    const finalHabitDetails: OnboardingData['habitDetails'] = {};
    for (const habit in data.habitDetails) {
        const d = data.habitDetails[habit] || {};
        finalHabitDetails[habit] = {
            packCost: Number(d.packCost) || 0,
            itemsPerPack: Number(d.itemsPerPack) || 0,
            itemsPerDay: d.itemsPerDay || '',
        };
    }

    const profileData = {
      ...data,
      habitDetails: finalHabitDetails,
    };
    
    const profileRef = doc(firestore, 'users', user.uid);
    
    try {
        await setDoc(profileRef, profileData, { merge: true });
        toast({
          title: 'Profile Saved!',
          description: "You're all set. Let's get started!",
        });
        window.location.reload();
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
    const value = getValues(key as any);
    if (Array.isArray(value)) return value.join(', ');
    const step = ONBOARDING_STEPS.find(s => s.field === key);
    if (step?.type === 'radio' && step.options) {
        return step.options.find(o => o.value === value)?.label || value;
    }
    return value || 'Not set';
  }
  
  const currentStepConfig = allSteps[currentStep - 1];

  const renderProgressDots = () => {
    return (
        <div className="flex justify-center items-center gap-2">
            {allSteps.map(step => (
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
            <div className="text-sm font-bold text-primary">{currentStep} / {allSteps.length}</div>
       </header>

       <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-xl md:text-2xl font-bold max-w-lg mb-10">
                {currentStepConfig.question}
            </h1>
            <div className="w-full max-w-md">
                {currentStepConfig.type === 'checkbox' && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {(currentStepConfig.options || []).map(habit => (
                            <Label key={habit.value} htmlFor={`habit-${habit.value}`} className={cn("flex flex-col items-center justify-center gap-2 rounded-md border-2 border-secondary bg-secondary/50 p-6 cursor-pointer hover:border-primary transition-colors", (formData.habits || []).includes(habit.value) && 'border-primary ring-2 ring-primary bg-primary/10')}>
                                 <Checkbox id={`habit-${habit.value}`} checked={(formData.habits || []).includes(habit.value)} onCheckedChange={() => handleHabitChange(habit.value)} className="sr-only" />
                                 {habit.value === 'Cigarettes' && <Cigarette className="w-8 h-8" />}
                                 {habit.value === 'Weed' && <Leaf className="w-8 h-8" />}
                                 <span className="font-medium text-sm">{habit.label}</span>
                            </Label>
                       ))}
                    </div>
                )}
                 {currentStepConfig.type === 'radio' && (
                    <QuestionRadioGroup 
                        name={currentStepConfig.field as string}
                        value={
                            currentStepConfig.field.startsWith('habitDetails')
                              ? formData.habitDetails[currentStepConfig.field.split('.')[1]]?.[currentStepConfig.field.split('.')[2] as 'itemsPerDay'] || ''
                              : (formData[currentStepConfig.field as keyof OnboardingData] as string) || ''
                          }
                        onValueChange={(v) => {
                            if (currentStepConfig.field.startsWith('habitDetails')) {
                                const [, habit, field] = currentStepConfig.field.split('.');
                                handleHabitDetailChange(habit, field as any, v);
                            } else {
                                handleChange(currentStepConfig.field as keyof OnboardingData, v);
                            }
                            setTimeout(nextStep, 200);
                        }}
                        items={currentStepConfig.options || []}
                    />
                 )}
                 {currentStepConfig.type === 'number' && (
                     <div className='flex flex-col items-center gap-8'>
                         <div className="flex flex-col items-center">
                            <Controller
                                name={currentStepConfig.field as `habitDetails.${string}.packCost` | `habitDetails.${string}.itemsPerPack`}
                                control={control}
                                render={({ field }) => (
                                    <>
                                    <div className="text-3xl font-bold min-h-[40px] flex items-center">
                                         {currentStepConfig.field.includes('packCost') && <span className="text-muted-foreground">$</span>}
                                        <span>{field.value || '0'}</span>
                                        <span className="animate-pulse">|</span>
                                    </div>
                                    <NumberKeypad
                                    value={field.value || ''}
                                    onValueChange={field.onChange}
                                    />
                                    </>
                                )}
                            />
                        </div>
                     </div>
                 )}
                 {currentStepConfig.type === 'summary' && (
                    <div className="space-y-4 text-left max-w-md mx-auto">
                        <h3 className="text-lg font-bold text-center">Your Baseline</h3>
                        <p className="text-muted-foreground text-center text-xs">You're all set. Hit finish to jump into your personalized dashboard and begin.</p>
                        <div className="bg-secondary/50 rounded-lg p-4 grid grid-cols-1 gap-y-2 text-sm">
                            <p><strong>Habits:</strong> {getSummaryValue('habits')}</p>
                            <p><strong>Goal:</strong> <span className="capitalize">{getSummaryValue('goal')}</span></p>
                             {(formData.habits || []).map(habit => (
                                <div key={habit}><strong>{habit} Avg:</strong> {formData.habitDetails[habit]?.itemsPerDay || 'Not set'}/day</div>
                             ))}
                        </div>
                    </div>
                 )}
            </div>
       </main>
       
        <footer className="p-6 space-y-6">
            {renderProgressDots()}
            {currentStep < allSteps.length ? (
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
