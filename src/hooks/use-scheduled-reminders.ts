
'use client';

import { useEffect } from 'react';
import { parse, isToday, isFuture, format } from 'date-fns';
import { useFirebase } from '@/firebase';

// TypeScript declarations for new Web APIs
declare global {
  const TimestampTrigger: any;
  interface ServiceWorkerRegistration {
    showNotification(title: string, options?: NotificationOptions & { showTrigger?: any }): Promise<void>;
  }
}

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
                
                const existingNotifications = await registration.getNotifications({ tag: 'moment:' });
                existingNotifications.forEach(notif => notif.close());

                const now = new Date();
                const todayStr = format(now, 'yyyy-MM-dd');

                moments.forEach(moment => {
                    const momentTime = parse(moment.time, 'HH:mm', new Date());

                    // Only schedule for moments planned for today that haven't been completed yet
                    if (isToday(momentTime) && moment.completed?.[todayStr] === undefined) {
                        const plannedAtMs = momentTime.getTime();
                        
                        // Send scheduling message to the service worker, which will create the notifications
                        registration.controller?.postMessage({
                            type: "SCHEDULE_MOMENT",
                            payload: {
                                momentId: moment.id,
                                userId: user.uid,
                                dateStr: todayStr,
                                plannedAtMs: plannedAtMs,
                                label: moment.label,
                                habit: moment.habit || 'Cigarettes',
                                url: `/en/dashboard`,
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("Error delegating notification scheduling to Service Worker:", error);
            }
        };

        scheduleNotifications();

    }, [moments, remindersEnabled, user]);
}
