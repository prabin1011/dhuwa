'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

const INITIAL_TIME = 300; // 5 minutes in seconds

export function UrgeSurfingTimer() {
    const [secondsRemaining, setSecondsRemaining] = useState(INITIAL_TIME);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && secondsRemaining > 0) {
            interval = setInterval(() => {
                setSecondsRemaining(seconds => seconds - 1);
            }, 1000);
        } else if (!isActive && secondsRemaining !== 0) {
            if (interval) clearInterval(interval);
        } else if (secondsRemaining === 0) {
             if (interval) clearInterval(interval);
             setIsActive(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsRemaining]);

    const toggle = () => {
        setIsActive(!isActive);
    };

    const reset = () => {
        setSecondsRemaining(INITIAL_TIME);
        setIsActive(false);
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div className="py-4 text-center flex flex-col items-center gap-6">
            <p className="text-6xl font-bold font-mono tracking-tighter">
                {formatTime(secondsRemaining)}
            </p>
            <p className="text-muted-foreground text-sm">
                {secondsRemaining === 0 ? "You did it. The wave has passed." : "You are stronger than this feeling."}
            </p>
            <div className="flex items-center gap-4">
                <Button onClick={toggle} size="lg" className="w-32">
                    {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={reset} variant="outline" size="icon" aria-label="Reset timer">
                    <RotateCcw className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
