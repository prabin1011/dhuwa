'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { alanCarrQuotes } from '@/lib/quotes';
import { cn } from '@/lib/utils';
import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

const INITIAL_TIME = 300; // 5 minutes

export function UrgeSurfingTimer() {
    const [secondsRemaining, setSecondsRemaining] = useState(INITIAL_TIME);
    const [isActive, setIsActive] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    const shuffledQuotes = useMemo(() => alanCarrQuotes.sort(() => 0.5 - Math.random()), []);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && secondsRemaining > 0) {
            interval = setInterval(() => setSecondsRemaining(s => s - 1), 1000);
        } else if (secondsRemaining === 0) {
            setIsActive(false);
        }

        return () => { if (interval) clearInterval(interval); };
    }, [isActive, secondsRemaining]);

    // Quote rotation
    useEffect(() => {
        if (!isActive) return;

        const quoteInterval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % shuffledQuotes.length);
        }, 7000);

        return () => clearInterval(quoteInterval);
    }, [isActive, shuffledQuotes.length]);

    const toggle = () => setIsActive(!isActive);

    const reset = () => {
        setSecondsRemaining(INITIAL_TIME);
        setIsActive(false);
        setQuoteIndex(0);
    }

    const formatTime = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    const isFinished = secondsRemaining === 0;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-between text-center overflow-hidden rounded-lg bg-black text-white p-6">
            <DialogHeader className="text-center items-center">
                <DialogTitle className="text-white">Ride the Urge Wave</DialogTitle>
                <DialogDescription className="text-white/70">
                    Urges are like waves. They build, peak, and then crash. They don't last forever. Just observe it.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center gap-8">
                 <p key={quoteIndex} className={cn("text-lg font-medium text-center text-white/90 max-w-sm transition-opacity duration-1000", isActive ? "animate-fade-in" : "opacity-100")}>
                    "{shuffledQuotes[quoteIndex]}"
                </p>
            </div>

            <div className="flex flex-col items-center gap-6">
                <p className="text-6xl font-bold font-mono tracking-tighter drop-shadow-lg">{formatTime(secondsRemaining)}</p>

                <div className="flex items-center gap-4">
                    <Button onClick={toggle} size="lg" className="w-32 bg-white text-black hover:bg-white/90 disabled:opacity-70" disabled={isFinished}>
                        {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={reset} variant="outline" size="icon" className="text-white border-white/50 bg-transparent hover:bg-white/10 hover:text-white rounded-full h-12 w-12" aria-label="Reset timer">
                        <RotateCcw className="h-6 w-6" />
                    </Button>
                </div>
                {isFinished && <p className="mt-2 text-lg font-semibold animate-fade-in">You did it. The wave has passed.</p>}
            </div>
        </div>
    );
}
