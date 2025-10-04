"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function SmokeLogger() {
  const handleLogSmoke = () => {
    // We will add firebase logic here later
    console.log("Logged a smoke at", new Date());
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
