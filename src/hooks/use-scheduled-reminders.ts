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
                // Ensure the service worker is ready before trying to message it.
                const registration = await navigator.serviceWorker.ready;
                
                // The SW will handle clearing old notifications, but we can clear them here too if we want.
                const existingNotifications = await registration.getNotifications({ includeTriggered: true });
                existingNotifications.forEach(notif => {
                    // This is a simple way to clear all, could be more targeted
                     notif.close();
                });
                
                const now = new Date();
                const todayStr = format(now, 'yyyy-MM-dd');

                moments.forEach(moment => {
                    const plannedDate = parse(`${todayStr} ${moment.time}`, 'yyyy-MM-dd HH:mm', new Date());
                    
                    // Only schedule for moments planned for today that haven't been completed yet and are in the future.
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
                console.error("Error delegating notification scheduling to Service Worker:", error);
            }
        };

        scheduleNotifications();

    }, [moments, remindersEnabled, user]);
}
