'use client';

import { useEffect } from 'react';
import { parse, isToday, format } from 'date-fns';
import { useFirebase } from '@/firebase';

interface SmokingMoment {
    id: string;
    time: string; // "HH:mm"
    label: string;
    completed: Record<string, boolean>;
    habit?: string;
}

interface UseScheduledRemindersProps {
    moments?: SmokingMoment[];
    remindersEnabled?: boolean;
}

export function useScheduledReminders({ moments, remindersEnabled }: UseScheduledRemindersProps) {
    const { user } = useFirebase();

    useEffect(() => {
        const supportsTriggers = 
            typeof window !== 'undefined' &&
            'Notification' in window &&
            'serviceWorker' in navigator &&
            'showTrigger' in Notification.prototype;

        if (!remindersEnabled || !moments || !user || !supportsTriggers || Notification.permission !== 'granted') {
            return;
        }

        const scheduleNotifications = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // On app load, always try to flush any logs that were queued while offline.
                registration.active?.postMessage({ type: 'FLUSH_QUEUE' });
                
                const now = new Date();
                const todayStr = format(now, 'yyyy-MM-dd');

                moments.forEach(moment => {
                    // Combine the moment's time with today's date
                    const plannedDate = parse(`${todayStr} ${moment.time}`, 'yyyy-MM-dd HH:mm', new Date());
                    
                    // Only schedule for moments planned for today that haven't been completed and are in the future.
                    if (isToday(plannedDate) && plannedDate > now && moment.completed?.[todayStr] === undefined) {
                        const plannedAtMs = plannedDate.getTime();
                        
                        // Use the active service worker to post the message.
                        registration.active?.postMessage({
                            type: "SCHEDULE_MOMENT",
                            payload: {
                                momentId: moment.id,
                                userId: user.uid,
                                dateStr: todayStr,
                                plannedAtMs: plannedAtMs,
                                label: moment.label,
                                habit: moment.habit || 'Cigarettes',
                                url: `/en/dashboard`, // Ensure a default valid URL
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("[Scheduler] Error delegating notification scheduling to Service Worker:", error);
            }
        };

        scheduleNotifications();

    }, [moments, remindersEnabled, user]);
}
