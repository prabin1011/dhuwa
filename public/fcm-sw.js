
// This file is intentionally separate from the main PWA service worker.
// It handles scheduling and clicking of local, scheduled notifications.

// --- Event Listeners ---

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_MOMENT') {
    // Use waitUntil to keep the service worker alive while we schedule.
    event.waitUntil(scheduleNotifications(event.data.payload));
  }
});

self.addEventListener('notificationclick', (event) => {
  const { action } = event;
  const data = event.notification.data || {};
  const { url, userId, momentId, dateStr, habit } = data;

  event.notification.close();

  // If the user clicks the notification body (not a button)
  if (!action) {
    event.waitUntil(clients.openWindow(url || '/'));
    return;
  }
  
  // If a button was clicked, handle the logging action
  if (action === 'log_yes' || action === 'log_no') {
     const smoked = action === 'log_yes';
     // Use waitUntil to ensure the fetch completes or is queued.
     event.waitUntil(
        fetch('/api/log-from-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, momentId, dateStr, smoked, habit }),
        })
     );
  }
});

// --- Core Logic ---

async function scheduleNotifications(payload) {
  const { momentId, label, plannedAtMs } = payload;
  
  // Nudge 5 minutes before
  const nudgeAt = plannedAtMs - 5 * 60 * 1000;
  // Check-in 5 minutes after
  const checkAt = plannedAtMs + 5 * 60 * 1000;
  
  // Clear any existing notifications for this moment to avoid duplicates
  const nudgeTag = `moment:${momentId}:nudge`;
  const checkinTag = `moment:${momentId}:checkin`;
  const existingNudges = await self.registration.getNotifications({ tag: nudgeTag });
  existingNudges.forEach(n => n.close());
  const existingCheckins = await self.registration.getNotifications({ tag: checkinTag });
  existingCheckins.forEach(n => n.close());

  // Schedule the "stop and think" nudge
  await self.registration.showNotification('A Moment of Choice', {
    body: `Your planned smoke "${label}" is in 5 minutes.`,
    data: { ...payload, kind: 'nudge' },
    showTrigger: new TimestampTrigger(nudgeAt),
    tag: nudgeTag,
  });

  // Schedule the interactive "did you smoke?" check-in
  await self.registration.showNotification(`Checking In: ${label}`, {
    body: 'The moment has passed. Did you end up smoking?',
    actions: [
      { action: 'log_yes', title: 'Yes, I smoked' },
      { action: 'log_no', title: 'No, I skipped it!' },
    ],
    data: { ...payload, kind: 'checkin' },
    showTrigger: new TimestampTrigger(checkAt),
    tag: checkinTag,
  });
}
