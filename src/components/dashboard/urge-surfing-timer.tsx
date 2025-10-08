'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { AnimatedWave } from './animated-wave';
import { alanCarrQuotes } from '@/lib/quotes';
import { cn } from '@/lib/utils';

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
        <div className="relative w-full h-96 flex flex-col items-center justify-center text-center overflow-hidden rounded-lg bg-primary">
            <AnimatedWave />
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-6 text-primary-foreground gap-8">
                 <p 
                    key={quoteIndex}
                    className={cn(
                        "text-xl font-medium text-center text-primary-foreground/90 max-w-sm transition-opacity duration-1000",
                        isActive ? "animate-fade-in" : "opacity-100"
                    )}
                >
                   "{shuffledQuotes[quoteIndex]}"
                </p>

                <div className="flex flex-col items-center gap-4">
                     <p className="text-6xl font-bold font-mono tracking-tighter drop-shadow-lg">
                        {formatTime(secondsRemaining)}
                    </p>
                    
                    <div className="flex items-center gap-4">
                        <Button onClick={toggle} size="lg" className="w-32 bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:opacity-70" disabled={isFinished}>
                            {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="outline" size="icon" className="text-primary-foreground border-primary-foreground/50 bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground" aria-label="Reset timer">
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
