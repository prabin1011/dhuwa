'use client';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface BreathingExerciseProps {
    onComplete: () => void;
}

const PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'];
const DURATION_SECONDS = 4; // 4 seconds per phase

export function BreathingExercise({ onComplete }: BreathingExerciseProps) {
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [countdown, setCountdown] = useState(DURATION_SECONDS);
    const [cycleCount, setCycleCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const totalCycles = 4;

    useEffect(() => {
        if (isFinished) return;

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev > 1) {
                    return prev - 1;
                }
                
                // Countdown finished, move to next phase
                setPhaseIndex((prevPhaseIndex) => {
                    const nextPhaseIndex = (prevPhaseIndex + 1) % PHASES.length;
                    if (nextPhaseIndex === 0) { // Completed a full inhale-hold-exhale-hold cycle
                        setCycleCount((prevCycleCount) => {
                            const newCount = prevCycleCount + 1;
                            if (newCount >= totalCycles) {
                                clearInterval(countdownInterval);
                                setIsFinished(true);
                            }
                            return newCount;
                        });
                    }
                    return nextPhaseIndex;
                });

                return DURATION_SECONDS; // Reset countdown for the new phase
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [isFinished, totalCycles]);
    
    const handleRepeat = () => {
        setPhaseIndex(0);
        setCountdown(DURATION_SECONDS);
        setCycleCount(0);
        setIsFinished(false);
    }

    const currentPhaseText = PHASES[phaseIndex];
    const isExpanding = currentPhaseText === 'Inhale';

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-8">
                 <div className="relative w-48 h-48 flex flex-col items-center justify-center">
                     <p className="text-2xl font-semibold z-10">Complete!</p>
                     <p className="text-sm text-muted-foreground mt-2">Well done.</p>
                </div>
                 <div className="flex gap-4">
                    <Button onClick={handleRepeat} variant="default">Repeat</Button>
                    <Button onClick={onComplete} variant="outline">Done</Button>
                 </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center gap-8 py-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <div 
                    className="absolute w-full h-full bg-primary/20 rounded-full transition-transform ease-in-out"
                    style={{
                        transitionDuration: `${DURATION_SECONDS}s`,
                        transform: isExpanding ? 'scale(1)' : 'scale(0.3)'
                    }}
                />
                <div className="z-10 text-center">
                    <p className="text-2xl font-semibold">{currentPhaseText}</p>
                    <p className="text-5xl font-mono font-bold mt-1">{countdown}</p>
                </div>
            </div>
             <p className="text-sm text-muted-foreground">
                Cycle {cycleCount + 1} of {totalCycles}
            </p>
             <Button onClick={onComplete} variant="outline">End Exercise</Button>
        </div>
    );
}
