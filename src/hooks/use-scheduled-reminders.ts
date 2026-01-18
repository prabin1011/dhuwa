
'use client';

import { useEffect, useRef } from 'react';
import { parse, isToday, isFuture } from 'date-fns';
import { REMINDER_TEMPLATES } from '@/lib/reminder-templates';

interface SmokingMoment {
    id: string;
    time: string; // "HH:mm"
    label: string;
    completed: Record<string, boolean>;
}

interface UseScheduledRemindersProps {
    moments?: SmokingMoment[];
    remindersEnabled?: boolean;
}

const NOTIFICATION_TAG_PREFIX = 'dhuwa-reminder-';
const MINUTES_BEFORE = 5;

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function useScheduledReminders({ moments, remindersEnabled }: UseScheduledRemindersProps) {
    const scheduledTimeouts = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        // 1. Clean up any previously scheduled timeouts on re-render
        scheduledTimeouts.current.forEach(clearTimeout);
        scheduledTimeouts.current = [];

        // 2. Check if the feature should run
        if (!remindersEnabled || !moments || typeof window === 'undefined' || !('serviceWorker' in navigator) || Notification.permission !== 'granted') {
            return;
        }

        const scheduleNotifications = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Close any previously scheduled, but not yet shown, notifications from this app
                const existingNotifications = await registration.getNotifications({ tag: NOTIFICATION_TAG_PREFIX });
                existingNotifications.forEach(notif => notif.close());

                const now = new Date();
                
                moments.forEach(moment => {
                    const momentTime = parse(moment.time, 'HH:mm', new Date());

                    // Only schedule for moments planned for today that haven't been completed
                    if (isToday(momentTime) && moment.completed?.[moment.id] === undefined) {
                        const notificationTime = new Date(momentTime.getTime() - MINUTES_BEFORE * 60 * 1000);

                        // Only schedule if the notification time is in the future
                        if (isFuture(notificationTime)) {
                            const delay = notificationTime.getTime() - now.getTime();
                            
                            const timeoutId = setTimeout(() => {
                                const { title, body } = pick(REMINDER_TEMPLATES);
                                
                                registration.showNotification(title, {
                                    body: body.replace('{{label}}', moment.label),
                                    icon: '/192x192.png',
                                    tag: `${NOTIFICATION_TAG_PREFIX}${moment.id}`, // Tag allows us to replace/close it
                                    renotify: true, // Vibrate/sound even if a previous notif with same tag was shown
                                });
                            }, delay);

                            scheduledTimeouts.current.push(timeoutId);
                        }
                    }
                });
            } catch (error) {
                console.error("Error scheduling notifications:", error);
            }
        };

        scheduleNotifications();

        // Cleanup function to clear timeouts when the component unmounts
        return () => {
            scheduledTimeouts.current.forEach(clearTimeout);
        };
    }, [moments, remindersEnabled]); // Re-run only when moments or the enabled flag change
}
