
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { MoodAfterDialogAction } from "./mood-after-toast-action";
import { getNarrative } from "@/lib/narrative-vault";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { formatDistanceStrict } from "date-fns";


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

const RELAPSE_THRESHOLD_HOURS = 24;

interface SmokeLoggerProps {
    habits: string[];
    lastUrgeTime?: Date;
}

export function SmokeLogger({ habits, lastUrgeTime }: SmokeLoggerProps) {
  const t = useTranslations('dashboard');
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [selectedHabit, setSelectedHabit] = useState(habits[0]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isMoodDialogOpen, setIsMoodDialogOpen] = useState(false);
  const [isAfterMoodDialogOpen, setIsAfterMoodDialogOpen] = useState(false);
  const [isRelapseDialogOpen, setIsRelapseDialogOpen] = useState(false);
  const [lastUrgeId, setLastUrgeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [smokeFreeBeforeLog, setSmokeFreeBeforeLog] = useState<string | null>(null);


  const handleLogSmoke = async () => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to track your habits." });
      return;
    }
    if (!selectedMood) {
        toast({ variant: "destructive", title: "Mood Required", description: "Please select a mood to continue." });
        return;
    }

    // Detect relapse: check if the user was smoke-free for 24+ hours before this log
    const now = new Date();
    let wasLongBreak = false;
    let smokeFreeLabel: string | null = null;
    if (lastUrgeTime) {
      const gapHours = (now.getTime() - lastUrgeTime.getTime()) / (1000 * 60 * 60);
      if (gapHours >= RELAPSE_THRESHOLD_HOURS) {
        wasLongBreak = true;
        smokeFreeLabel = formatDistanceStrict(lastUrgeTime, now);
      }
    }

    // Close the initial mood dialog
    setIsMoodDialogOpen(false);

    trackEvent('log_smoke', 'Smoke Logger', selectedHabit, quantity);

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
          source: 'manual',
        };

        const docRef = await addDoc(urgesCollection, urgeData);
        setLastUrgeId(docRef.id);

        if (wasLongBreak && smokeFreeLabel) {
          // Show compassionate relapse recovery dialog first
          setSmokeFreeBeforeLog(smokeFreeLabel);
          setIsRelapseDialogOpen(true);
        } else {
          // Normal flow: open the "mood after" dialog
          setIsAfterMoodDialogOpen(true);
        }

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
    setIsRelapseDialogOpen(false);
    setLastUrgeId(null);
    setSmokeFreeBeforeLog(null);
  }

  const handleRelapseAcknowledge = () => {
    setIsRelapseDialogOpen(false);
    setIsAfterMoodDialogOpen(true);
  };

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

        {/* Compassionate relapse recovery dialog */}
        <Dialog open={isRelapseDialogOpen} onOpenChange={open => { if (!open) handleRelapseAcknowledge(); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <div className="text-4xl text-center mb-1">🌱</div>
              <DialogTitle className="text-center">Every step still counts</DialogTitle>
              <DialogDescription className="text-center space-y-3 pt-2">
                <span className="block">
                  You were smoke-free for <span className="font-semibold text-foreground">{smokeFreeBeforeLog}</span>. That is real progress — and it belongs to you forever.
                </span>
                <span className="block text-xs">
                  A slip is not a failure. It is data. Every quit attempt teaches your brain something new about your triggers. You are still moving forward.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <Button className="w-full" onClick={handleRelapseAcknowledge}>
                Continue my journey
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your streak will reset — but your history stays. You have not lost anything.
              </p>
            </div>
          </DialogContent>
        </Dialog>

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
