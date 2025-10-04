"use client";

import { Button } from "@/components/ui/button";
import { useFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { collection, serverTimestamp } from "firebase/firestore";
import { Cigarette, Leaf, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react";


interface SmokeLoggerProps {
    habits: string[];
}

export function SmokeLogger({ habits }: SmokeLoggerProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [selectedHabit, setSelectedHabit] = useState(habits[0]);

  const handleLogSmoke = () => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to track your habits.",
      });
      return;
    }
    
    const urgesCollection = collection(firestore, 'users', user.uid, 'urges');
    
    addDocumentNonBlocking(urgesCollection, {
      timestamp: serverTimestamp(),
      type: selectedHabit,
      notes: "" 
    });

    toast({
      title: "Logged!",
      description: `A moment of awareness for ${selectedHabit} has been recorded.`,
    });
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
        <Button size="lg" className="w-full" onClick={handleLogSmoke}>
            <Icon className="w-5 h-5 mr-2" />
            Tap to add a cigarette
        </Button>
    </div>
  );
}
