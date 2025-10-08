
'use client';

import { Button } from "../ui/button";
import { Hand, Waves, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BreathingExercise } from "./breathing-exercise";
import { useState } from "react";
import { UrgeSurfingTimer } from "./urge-surfing-timer";
import { GroundingExercise } from "./grounding-exercise";

export function SosActionBar() {
    const [isBreathingOpen, setIsBreathingOpen] = useState(false);
    const [isUrgeSurfingOpen, setIsUrgeSurfingOpen] = useState(false);
    const [isGroundingOpen, setIsGroundingOpen] = useState(false);

    return (
        <div className="grid grid-cols-3 gap-2">
            <Dialog open={isBreathingOpen} onOpenChange={setIsBreathingOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-12">
                        <Waves className="w-5 h-5 mr-2" />
                        Breathe
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Breathing Exercises</DialogTitle>
                        <DialogDescription>
                           Select a protocol and follow the prompts to calm your mind and body.
                        </DialogDescription>
                    </DialogHeader>
                    <BreathingExercise onComplete={() => setIsBreathingOpen(false)} />
                </DialogContent>
            </Dialog>

             <Dialog open={isGroundingOpen} onOpenChange={setIsGroundingOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-12">
                        <Hand className="w-5 h-5 mr-2" />
                        Ground
                    </Button>
                </DialogTrigger>
                 <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>5-4-3-2-1 Grounding</DialogTitle>
                        <DialogDescription>
                            Take a moment to center yourself by noticing your surroundings.
                        </DialogDescription>
                    </DialogHeader>
                    <GroundingExercise />
                </DialogContent>
            </Dialog>

            <Dialog open={isUrgeSurfingOpen} onOpenChange={setIsUrgeSurfingOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-12">
                         <Zap className="w-5 h-5 mr-2" />
                        Urge Surf
                    </Button>
                </DialogTrigger>
                <DialogContent data-full-bleed="true" className="w-[calc(100vw-2rem)] sm:w-full max-w-lg h-[80vh] max-h-[600px] p-0">
                    <UrgeSurfingTimer />
                </DialogContent>
            </Dialog>
        </div>
    );
}
