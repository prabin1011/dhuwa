'use client';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface BreathingExerciseProps {
    onComplete: () => void;
}

const PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'];
const DURATION = 4000; // 4 seconds per phase

export function BreathingExercise({ onComplete }: BreathingExerciseProps) {
    const [phase, setPhase] = useState(0);
    const [cycleCount, setCycleCount] = useState(0);
    const totalCycles = 4;

    useEffect(() => {
        const interval = setInterval(() => {
            setPhase((prevPhase) => {
                const nextPhase = (prevPhase + 1) % PHASES.length;
                if (nextPhase === 0) {
                    setCycleCount((prevCount) => {
                        const newCount = prevCount + 1;
                        if (newCount >= totalCycles) {
                            clearInterval(interval);
                            onComplete();
                        }
                        return newCount;
                    });
                }
                return nextPhase;
            });
        }, DURATION);

        return () => clearInterval(interval);
    }, [onComplete, totalCycles]);
    
    const currentPhaseText = PHASES[phase];
    const isHolding = currentPhaseText === 'Hold';
    const isExpanding = currentPhaseText === 'Inhale';

    return (
        <div className="flex flex-col items-center justify-center gap-8 py-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <div 
                    className="absolute w-full h-full bg-primary/20 rounded-full transition-transform duration-[3500ms] ease-in-out"
                    style={{
                        transform: isExpanding ? 'scale(1)' : 'scale(0.3)'
                    }}
                />
                <p className="text-2xl font-semibold z-10">{currentPhaseText}</p>
            </div>
             <p className="text-sm text-muted-foreground">
                Cycle {cycleCount + 1} of {totalCycles}
            </p>
             <Button onClick={onComplete} variant="outline">End Exercise</Button>
        </div>
    );
}
