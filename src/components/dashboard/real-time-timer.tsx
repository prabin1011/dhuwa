"use client";

import { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { Card, CardContent } from '../ui/card';
import { Timer } from 'lucide-react';

interface RealTimeTimerProps {
  lastUrgeTime?: Date;
}

const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function RealTimeTimer({ lastUrgeTime }: RealTimeTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!lastUrgeTime) {
    return (
        <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center p-6">
                 <Timer className="w-6 h-6 text-primary mb-2" />
                <p className="text-xl font-bold text-center">Let's get started!</p>
                <p className="text-sm text-muted-foreground">Log your first smoke to begin tracking.</p>
            </CardContent>
      </Card>
    )
  }

  const secondsSince = differenceInSeconds(currentTime, lastUrgeTime);

  return (
    <Card className="bg-card">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Timer className="w-6 h-6 text-primary mb-2" />
        <p className="text-4xl font-bold font-mono tracking-tighter">
          {formatDuration(secondsSince)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Time Since Last Smoke</p>
      </CardContent>
    </Card>
  );
}
