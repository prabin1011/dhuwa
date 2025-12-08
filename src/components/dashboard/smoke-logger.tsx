
"use client";

import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { Cigarette, Leaf, Minus, Plus, MinusCircle, Wind } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { MoodAfterDialogAction } from "./mood-after-toast-action";
import { getNarrative } from "@/lib/narrative-vault";
import { useTranslations } from "next-intl";


const MOOD_OPTIONS = [
    {value: 'stressed', label: 'Stressed'},
    {value: 'bored', label: 'Bored'},
    {value: 'lonely', label: 'Lonely'},
    {value: 'happy', label: 'Happy'},
    {value: 'tired', label: 'Tired'},
    {value: 'anxious', label: 'Anxious'},
    {value: 'daily-ritual', label: 'Daily Ritual'},
    {value: 'neutral', label: 'Neutral'},
]

interface SmokeLoggerProps {
    habits: string[];
}

export function SmokeLogger({ habits }: SmokeLoggerProps) {
  const t = useTranslations('dashboard');
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [selectedHabit, setSelectedHabit] = useState(habits[0]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [isAfterMoodDialogOpen, setIsAfterMoodDialogOpen] = useState(false);
  const [lastUrgeId, setLastUrgeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);


  const handleLogSmoke = async () => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to track your habits." });
      return;
    }
    if (!selectedMood) {
        toast({ variant: "destructive", title: "Mood Required", description: "Please select a mood to continue." });
        return;
    }
    
    // Close the initial mood dialog
    setIsMoodDialogOpen(false);
    
    const urgesCollection = collection(firestore, 'users', user.uid, 'urges');
    
    try {
        const { long, short } = getNarrative(selectedMood);

        const urgeData = {
          timestamp: serverTimestamp(),
          type: selectedHabit,
          moodBefore: selectedMood,
          notes: "",
          narrative: long,
          shortMessage: short,
          count: quantity,
        };

        const docRef = await addDoc(urgesCollection, urgeData);
        setLastUrgeId(docRef.id);
        
        // Immediately open the second dialog
        setIsAfterMoodDialogOpen(true);
        
    } catch(e) {
        console.error("Error logging smoke: ", e);
        toast({
            variant: "destructive",
            title: "Logging failed",
            description: "Could not save your smoke log. Please try again."
        })
        // Reset state on failure
        setSelectedMood(null);
        setQuantity(1);
    }
  };
  
  const resetForms = () => {
    setSelectedMood(null);
    setQuantity(1);
    setIsMoodDialogOpen(false);
    setIsAfterMoodDialogOpen(false);
    setLastUrgeId(null);
  }

  const HabitIcon = ({ habit }: { habit: string }) => {
    if (habit === 'Vape') return <Wind className="w-4 h-4" />;
    if (habit === 'Weed') return <Leaf className="w-4 h-4" />;
    if (habit === 'Snus') return <MinusCircle className="w-4 h-4" />;
    return <Cigarette className="w-4 h-4" />;
  }

  return (
    <div className="flex items-center gap-2">
        <AlertDialog open={isMoodDialogOpen} onOpenChange={setIsMoodDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full">
                    <Cigarette className="w-5 h-5 mr-2" />
                    {t('tapToLog')}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('logDialog.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('logDialog.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-6">
                    {habits.length > 1 && (
                        <div className="space-y-2">
                             <Label>{t('logDialog.habit_label')}</Label>
                             <Select value={selectedHabit} onValueChange={setSelectedHabit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select habit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {habits.map(habit => (
                                        <SelectItem key={habit} value={habit}>
                                            <div className="flex items-center gap-2">
                                                <HabitIcon habit={habit} />
                                                {habit}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                     <RadioGroup value={selectedMood ?? ''} onValueChange={setSelectedMood} className="grid grid-cols-2 gap-3">
                        {MOOD_OPTIONS.map(item => (
                            <Label key={item.value} htmlFor={`mood-${item.value}`} className="flex items-center space-x-3 rounded-md border-2 border-secondary bg-secondary/50 p-3 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary/10">
                                <RadioGroupItem value={item.value} id={`mood-${item.value}`} />
                                <p className="font-medium text-sm">{item.label}</p>
                            </Label>
                        ))}
                    </RadioGroup>
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <div className="text-center">
                            <p className="text-3xl font-bold">{quantity}</p>
                            <p className="text-xs text-muted-foreground">{selectedHabit}{quantity > 1 ? 's' : ''}</p>
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(q => q + 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={resetForms}>{t('logDialog.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogSmoke} disabled={!selectedMood}>
                        {t('logDialog.log_smoke')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* This is the second, mandatory dialog for "mood after" */}
         <AlertDialog open={isAfterMoodDialogOpen} onOpenChange={setIsAfterMoodDialogOpen}>
            <AlertDialogContent>
                 <AlertDialogHeader>
                    <AlertDialogTitle>{t('logDialog.moment_recorded')}</AlertDialogTitle>
                    <AlertDialogDescription>
                       {t('logDialog.moment_recorded_desc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {lastUrgeId && <MoodAfterDialogAction urgeId={lastUrgeId} onMoodSelect={resetForms} />}
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
