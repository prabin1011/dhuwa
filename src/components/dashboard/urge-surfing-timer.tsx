'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { AnimatedWave } from './animated-wave';
import { alanCarrQuotes } from '@/lib/quotes';
import { cn } from '@/lib/utils';
import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

const INITIAL_TIME = 300; // 5 minutes

export function UrgeSurfingTimer() {
    const [secondsRemaining, setSecondsRemaining] = useState(INITIAL_TIME);
    const [isActive, setIsActive] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    const shuffledQuotes = useMemo(() => alanCarrQuotes.sort(() => 0.5 - Math.random()), []);

    // Timer logic
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
    };

    const formatTime = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    const isFinished = secondsRemaining === 0;

    return (
        <div className="relative w-full h-full flex flex-col items-center text-center overflow-hidden rounded-lg bg-black text-white">
            <AnimatedWave />
            <div className="relative z-10 flex flex-1 flex-col items-center justify-between w-full h-full p-6">
                {/* Top quotes */}
                <p key={quoteIndex} className={cn("text-base font-medium text-center text-white/90 max-w-sm transition-opacity duration-1000", isActive ? "animate-fade-in" : "opacity-100")}>
                    "{shuffledQuotes[quoteIndex]}"
                </p>

                {/* Bottom timer & controls */}
                <div className="flex flex-col items-center gap-4">
                    <p className="text-4xl font-bold font-mono tracking-tighter drop-shadow-lg">{formatTime(secondsRemaining)}</p>

                    <div className="flex items-center gap-4">
                        <Button onClick={toggle} size="lg" className="w-32 bg-white/90 text-black hover:bg-white disabled:opacity-70" disabled={isFinished}>
                            {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={reset} variant="outline" size="icon" className="text-white border-white/20 bg-black/50 hover:bg-white/10 hover:text-white" aria-label="Reset timer">
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                    </div>
                    {isFinished && <p className="mt-2 text-lg font-semibold animate-fade-in">You did it. The wave has passed.</p>}
                </div>
            </div>
        </div>
    );
}
