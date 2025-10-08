'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { AnimatedWave } from './animated-wave';
import { alanCarrQuotes } from '@/lib/quotes';
import { cn } from '@/lib/utils';
import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

const INITIAL_TIME = 300; // 5 minutes in seconds

export function UrgeSurfingTimer() {
    const [secondsRemaining, setSecondsRemaining] = useState(INITIAL_TIME);
    const [isActive, setIsActive] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    // Memoize the quotes to prevent re-shuffling on every render
    const shuffledQuotes = useMemo(() => alanCarrQuotes.sort(() => 0.5 - Math.random()), []);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && secondsRemaining > 0) {
            interval = setInterval(() => {
                setSecondsRemaining(seconds => seconds - 1);
            }, 1000);
        } else if (secondsRemaining === 0) {
            setIsActive(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsRemaining]);

    // Quote rotation logic
    useEffect(() => {
        if (!isActive) return;

        const quoteInterval = setInterval(() => {
            setQuoteIndex(prevIndex => (prevIndex + 1) % shuffledQuotes.length);
        }, 7000); // Change quote every 7 seconds

        return () => clearInterval(quoteInterval);
    }, [isActive, shuffledQuotes.length]);


    const toggle = () => {
        setIsActive(!isActive);
    };

    const reset = () => {
        setSecondsRemaining(INITIAL_TIME);
        setIsActive(false);
        setQuoteIndex(0); // Reset to the first quote
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const isFinished = secondsRemaining === 0;

    return (
        <div className="relative w-full h-full flex flex-col items-center text-center overflow-hidden rounded-lg bg-black text-white">
            <DialogHeader className="pt-6 px-6 pb-0 text-center items-center z-20">
                 <DialogTitle>Ride the Urge Wave</DialogTitle>
                <DialogDescription>
                    Urges are like waves. They build, peak, and then crash. They don't last forever. Just observe it.
                </DialogDescription>
            </DialogHeader>
            
            <div className="relative z-10 flex flex-1 flex-col items-center justify-between h-full w-full p-6">
                <p 
                    key={quoteIndex}
                    className={cn(
                        "text-base font-medium text-center text-white/90 max-w-sm transition-opacity duration-1000",
                        isActive ? "animate-fade-in" : "opacity-100"
                    )}
                >
                   "{shuffledQuotes[quoteIndex]}"
                </p>
                
                <AnimatedWave />

                <div className="flex flex-col items-center gap-4 z-10">
                     <p className="text-4xl font-bold font-mono tracking-tighter drop-shadow-lg">
                        {formatTime(secondsRemaining)}
                    </p>
                    
                    <div className="flex items-center gap-4">
                        <Button onClick={toggle} size="lg" className="w-32 bg-white/90 text-black hover:bg-white disabled:opacity-70" disabled={isFinished}>
                            {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="outline" size="icon" className="text-white border-white/20 bg-black/50 hover:bg-white/10 hover:text-white" aria-label="Reset timer">
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                    </div>
                    {isFinished && (
                        <p className="mt-2 text-lg font-semibold animate-fade-in">You did it. The wave has passed.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
