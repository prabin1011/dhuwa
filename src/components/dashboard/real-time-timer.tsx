'use client';

import { useEffect, useState, useMemo } from 'react';
import { differenceInSeconds, formatDistanceStrict } from 'date-fns';
import { Card, CardContent } from '../ui/card';
import { Timer } from 'lucide-react';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';

interface Urge {
  timestamp: Timestamp;
}
interface RealTimeTimerProps {
  sortedUrges: WithId<Urge>[];
}

const formatDuration = (totalSeconds: number) => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
};

export function RealTimeTimer({ sortedUrges }: RealTimeTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { lastUrgeTime, previousInterval } = useMemo(() => {
    if (sortedUrges.length === 0) {
      return { lastUrgeTime: undefined, previousInterval: null };
    }
    const lastUrge = sortedUrges[0]?.timestamp?.toDate();
    if (sortedUrges.length < 2) {
      return { lastUrgeTime: lastUrge, previousInterval: null };
    }
    const secondLastUrge = sortedUrges[1]?.timestamp?.toDate();
    const interval = formatDistanceStrict(lastUrge, secondLastUrge);
    return { lastUrgeTime: lastUrge, previousInterval: interval };
  }, [sortedUrges]);

  if (!lastUrgeTime) {
    return (
      <Card className="bg-card">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Timer className="w-6 h-6 text-primary mb-2" />
          <p className="text-xl font-bold text-center">Let's get started!</p>
          <p className="text-sm text-muted-foreground">
            Log your first smoke to begin tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  const secondsSince = differenceInSeconds(currentTime, lastUrgeTime);

  return (
    <Card className="bg-card">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Timer className="w-6 h-6 text-primary mb-2" />
        <p className="text-4xl font-bold font-mono tracking-tighter">
          {formatDuration(secondsSince)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Time Since Last Smoke
        </p>
        {previousInterval && (
           <p className="text-xs text-muted-foreground mt-2">
            Your last smoke-free interval was {previousInterval}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
