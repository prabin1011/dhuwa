
'use client';

import { useEffect, useRef } from 'react';
import { parse, isToday, isFuture, format } from 'date-fns';
import { REMINDER_TEMPLATES, CONFIRMATION_TEMPLATES } from '@/lib/reminder-templates';
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

const NOTIFICATION_TAG_PREFIX = 'dhuwa-reminder-';
const MINUTES_BEFORE = 5;
const MINUTES_AFTER = 5;

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function useScheduledReminders({ moments, remindersEnabled }: UseScheduledRemindersProps) {
    const { user } = useFirebase(); // Get user for payload

    useEffect(() => {
        if (!remindersEnabled || !moments || !user || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('showTrigger' in ServiceWorkerRegistration.prototype) || Notification.permission !== 'granted') {
            return;
        }

        const scheduleNotifications = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Clear any previously scheduled (but not yet shown) notifications from this app
                const existingNotifications = await registration.getNotifications({ tag: NOTIFICATION_TAG_PREFIX });
                existingNotifications.forEach(notif => notif.close());

                const now = new Date();
                const todayStr = format(now, 'yyyy-MM-dd');

                moments.forEach(moment => {
                    const momentTime = parse(moment.time, 'HH:mm', new Date());

                    // Only schedule for moments planned for today that haven't been completed
                    if (isToday(momentTime) && moment.completed?.[todayStr] === undefined) {
                        
                        // --- Schedule Pre-Smoke Reminder ---
                        const reminderTime = new Date(momentTime.getTime() - MINUTES_BEFORE * 60 * 1000);
                        if (isFuture(reminderTime)) {
                            const { title, body } = pick(REMINDER_TEMPLATES);
                             registration.showNotification(title, {
                                body: body.replace('{{label}}', moment.label),
                                icon: '/192x192.png',
                                tag: `${NOTIFICATION_TAG_PREFIX}reminder-${moment.id}`,
                                renotify: true,
                                showTrigger: new TimestampTrigger(reminderTime.getTime()),
                                data: { url: `/en/dashboard` } // URL to open on click
                            });
                        }

                        // --- Schedule Post-Smoke Confirmation ---
                        const confirmationTime = new Date(momentTime.getTime() + MINUTES_AFTER * 60 * 1000);
                         if (isFuture(confirmationTime)) {
                            const { title, body } = pick(CONFIRMATION_TEMPLATES);
                             registration.showNotification(title.replace('{{label}}', moment.label), {
                                body: body,
                                icon: '/192x192.png',
                                tag: `${NOTIFICATION_TAG_PREFIX}confirm-${moment.id}`,
                                renotify: true,
                                requireInteraction: true, // Keep notification open until user interacts
                                showTrigger: new TimestampTrigger(confirmationTime.getTime()),
                                actions: [
                                    { action: 'log_yes', title: 'Yes, I smoked' },
                                    { action: 'log_no', title: 'No, I skipped it!' }
                                ],
                                data: {
                                    action: 'log_smoke_result',
                                    userId: user.uid,
                                    momentId: moment.id,
                                    dateStr: todayStr
                                }
                            });
                        }
                    }
                });
            } catch (error) {
                console.error("Error scheduling notifications:", error);
            }
        };

        scheduleNotifications();

        // No cleanup needed for `showTrigger` as it's handled by the browser
    }, [moments, remindersEnabled, user]); // Re-run only when moments, user, or the enabled flag change
}
