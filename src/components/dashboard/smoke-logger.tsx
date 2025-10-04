"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { collection, serverTimestamp } from "firebase/firestore";
import { Plus } from "lucide-react";

export function SmokeLogger() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

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
      notes: "" 
    });

    toast({
      title: "Logged!",
      description: "A moment of awareness has been recorded.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Track Your Habits</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-10">
        <Button size="lg" className="h-24 w-full text-xl" onClick={handleLogSmoke}>
          <Plus className="w-8 h-8 mr-4" /> I Just Smoked
        </Button>
        <p className="text-muted-foreground text-sm mt-4">
          Tap here to log a cigarette. Be honest with yourself.
        </p>
      </CardContent>
    </Card>
  );
}
