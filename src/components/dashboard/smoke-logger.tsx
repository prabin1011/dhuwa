
"use client";

import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { Cigarette, Leaf, Minus, Plus } from "lucide-react";
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
import { MoodAfterToastAction } from "./mood-after-toast-action";
import { getNarrative } from "@/lib/narrative-vault";


const MOOD_OPTIONS = [
    {value: 'stressed', label: 'Stressed'},
    {value: 'bored', label: 'Bored'},
    {value: 'lonely', label: 'Lonely'},
    {value: 'happy', label: 'Happy'},
    {value: 'tired', label: 'Tired'},
    {value: 'anxious', label: 'Anxious'},
    {value: 'neutral', label: 'Neutral'},
]

interface SmokeLoggerProps {
    habits: string[];
}

export function SmokeLogger({ habits }: SmokeLoggerProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [selectedHabit, setSelectedHabit] = useState(habits[0]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    
    const urgesCollection = collection(firestore, 'users', user.uid, 'urges');
    
    try {
        // Generate narrative and short message locally
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

        toast({
          title: `Smoke${quantity > 1 ? 's' : ''} Logged!`,
          description: `Your moment of awareness has been recorded.`,
          duration: 10000,
          action: <MoodAfterToastAction urgeId={docRef.id} />,
        });
        
    } catch(e) {
        console.error("Error logging smoke: ", e);
        toast({
            variant: "destructive",
            title: "Logging failed",
            description: "Could not save your smoke log. Please try again."
        })
    }


    // Reset state and close dialog
    setSelectedMood(null);
    setQuantity(1);
    setIsDialogOpen(false);
  };

  const Icon = selectedHabit === 'Weed' ? Leaf : Cigarette;

  return (
    <div className="flex items-center gap-2">
       {habits.length > 1 && (
            <Select value={selectedHabit} onValueChange={setSelectedHabit}>
              <SelectTrigger className="w-auto flex-shrink-0">
                <SelectValue placeholder="Select habit" />
              </SelectTrigger>
              <SelectContent>
                {habits.map(habit => (
                    <SelectItem key={habit} value={habit}>{habit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        )}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button size="lg" className="w-full">
                    <Icon className="w-5 h-5 mr-2" />
                    Tap to Log a Moment
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>How are you feeling?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Select the primary emotion you feel right now. This helps you identify triggers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-6">
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
                    <AlertDialogCancel onClick={() => {setSelectedMood(null); setQuantity(1)}}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogSmoke} disabled={!selectedMood}>
                        Log Smoke
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
