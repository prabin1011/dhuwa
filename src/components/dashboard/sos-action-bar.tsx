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

export function SosActionBar() {
    const [isBreathingOpen, setIsBreathingOpen] = useState(false);

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
                        <DialogTitle>Box Breathing</DialogTitle>
                        <DialogDescription>
                            Follow the animation. Inhale as the circle expands, hold, exhale as it shrinks, and hold again.
                        </DialogDescription>
                    </DialogHeader>
                    <BreathingExercise onComplete={() => setIsBreathingOpen(false)} />
                </DialogContent>
            </Dialog>

             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-12">
                        <Hand className="w-5 h-5 mr-2" />
                        Ground
                    </Button>
                </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>5-4-3-2-1 Grounding</DialogTitle>
                        <DialogDescription>
                            Take a moment to center yourself by noticing your surroundings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-left py-4">
                        <p><strong>5. SEE:</strong> Look around and name five things you can see. Notice colors, shapes, and details.</p>
                        <p><strong>4. FEEL:</strong> Pay attention to your body and name four things you can feel (e.g., your feet on the floor, the chair against your back).</p>
                        <p><strong>3. HEAR:</strong> Listen carefully and name three things you can hear, near or far.</p>
                        <p><strong>2. SMELL:</strong> Take a deep breath and name two things you can smell.</p>
                        <p><strong>1. TASTE:</strong> Name one thing you can taste, even if it's just the roof of your mouth.</p>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="h-12">
                         <Zap className="w-5 h-5 mr-2" />
                        Urge Surf
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                         <DialogTitle>Ride the Urge Wave</DialogTitle>
                        <DialogDescription>
                            Urges are like waves. They build, peak, and then crash. They don't last forever. Set a timer and just observe it.
                        </DialogDescription>
                    </DialogHeader>
                    <UrgeSurfingTimer />
                </DialogContent>
            </Dialog>
        </div>
    );
}
