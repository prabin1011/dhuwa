
'use client';

import { useEffect } from 'react';
import { parse, isToday, format } from 'date-fns';
import { useFirebase } from '@/firebase';

// TypeScript declarations for new Web APIs
declare global {
  // eslint-disable-next-line no-var
  var TimestampTrigger: any;
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
                // Ensure the service worker is ready before trying to message it.
                const registration = await navigator.serviceWorker.ready;
                
                // Clear all previously scheduled notifications to prevent stale ones from firing.
                const existingNotifications = await registration.getNotifications({ includeTriggered: true });
                existingNotifications.forEach(notif => notif.close());

                const now = new Date();
                const todayStr = format(now, 'yyyy-MM-dd');

                moments.forEach(moment => {
                    // Combine today's date with the moment's time to get a full Date object.
                    const plannedDate = parse(`${todayStr} ${moment.time}`, 'yyyy-MM-dd HH:mm', new Date());
                    
                    // Only schedule for moments planned for today that haven't been completed yet.
                    if (isToday(plannedDate) && moment.completed?.[todayStr] === undefined) {
                        const plannedAtMs = plannedDate.getTime();
                        
                        // Use the active controller to post the message.
                        navigator.serviceWorker.controller?.postMessage({
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
                console.error("Error delegating notification scheduling to Service Worker:", error);
            }
        };

        scheduleNotifications();

    }, [moments, remindersEnabled, user]);
}
