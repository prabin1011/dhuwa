
'use client';

import { useEffect, useState, useMemo } from 'react';
import { differenceInSeconds, format, formatDistanceStrict, isToday, subDays } from 'date-fns';
import { Card, CardContent } from '../ui/card';
import { CalendarIcon, Timer } from 'lucide-react';
import type { WithId } from '@/firebase';
import type { Timestamp } from 'firebase/firestore';
import { Dialog, DialogTrigger, DialogContent } from '../ui/dialog';
import { Calendar } from '../ui/calendar';
import { timestampToDate } from '@/lib/timestamp';

interface Urge {
  timestamp: Timestamp;
  type?: string;
}
interface RealTimeTimerProps {
  sortedUrges: WithId<Urge>[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
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

export function RealTimeTimer({ sortedUrges, selectedDate, onSelectDate }: RealTimeTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { lastUrgeTime, previousInterval } = useMemo(() => {
    const validUrges = sortedUrges
      .map((urge) => timestampToDate(urge.timestamp))
      .filter((date): date is Date => date != null)
      .sort((a, b) => b.getTime() - a.getTime());

    if (validUrges.length === 0) {
      return { lastUrgeTime: undefined, previousInterval: null };
    }
    const lastUrge = validUrges[0];
    if (validUrges.length < 2) {
      return { lastUrgeTime: lastUrge, previousInterval: null };
    }
    const secondLastUrge = validUrges[1];
    const interval = formatDistanceStrict(lastUrge, secondLastUrge);
    return { lastUrgeTime: lastUrge, previousInterval: interval };
  }, [sortedUrges]);
  
  const handleDateSelect = (date: Date | undefined) => {
      onSelectDate(date);
      setIsCalendarOpen(false);
  }

  const isViewingToday = selectedDate ? isToday(selectedDate) : true;

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
    <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogTrigger asChild>
            <Card className="bg-card cursor-pointer hover:bg-secondary/30 transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6">
                    {isViewingToday ? (
                        <>
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
                        </>
                    ) : (
                         <>
                            <CalendarIcon className="w-6 h-6 text-primary mb-2" />
                            <p className="text-2xl font-bold">
                                {selectedDate ? format(selectedDate, 'MMMM d') : 'Select Date'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Viewing Past Data
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </DialogTrigger>
        <DialogContent>
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date > new Date() || date < subDays(new Date(), 365)}
                initialFocus
            />
        </DialogContent>
    </Dialog>
  );
}
