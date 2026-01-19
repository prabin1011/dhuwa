'use client';

import { useEffect } from 'react';
import { parse, format } from 'date-fns';
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
      'serviceWorker' in navigator &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      'TimestampTrigger' in (window as any);

    if (!remindersEnabled || !moments?.length || !user || !supportsTriggers) return;

    const run = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;

        // Opportunistic flush (helps iOS/unsupported sync cases)
        reg.active?.postMessage({ type: 'FLUSH_QUEUE' });

        const nowMs = Date.now();
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        for (const m of moments) {
          // Skip already completed for today
          if (m.completed?.[todayStr] !== undefined) continue;

          const plannedDate = parse(`${todayStr} ${m.time}`, 'yyyy-MM-dd HH:mm', new Date());
          const plannedAtMs = plannedDate.getTime();

          // Two notifications per moment
          const nudgeAt = plannedAtMs - 5 * 60 * 1000;  // -5 min
          const checkAt = plannedAtMs + 5 * 60 * 1000;  // +5 min

          // Schedule if at least one of the two is still in the future
          const shouldSchedule = nudgeAt > nowMs || checkAt > nowMs;
          if (!shouldSchedule) continue;

          reg.active?.postMessage({
            type: 'SCHEDULE_MOMENT',
            payload: {
              momentId: m.id,
              userId: user.uid,
              dateStr: todayStr,
              plannedAtMs,
              label: m.label,
              habit: m.habit || 'Cigarettes',
              url: `/en/dashboard`,
            },
          });
        }
      } catch (e) {
        console.error('[Scheduler] Failed:', e);
      }
    };

    run();
  }, [moments, remindersEnabled, user]);
}
