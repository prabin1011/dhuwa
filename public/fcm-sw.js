// A simple IndexedDB wrapper
const DB_NAME = 'dhuwa-request-queue';
const DB_VERSION = 1;
const STORE_NAME = 'log-queue';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToQueue(entry) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(entry);
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

async function getQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}

async function deleteFromQueue(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

// The main function to flush the queue
async function flushQueue() {
  const queuedLogs = await getQueue();
  if (queuedLogs.length === 0) {
    return Promise.resolve();
  }

  console.log('[SW] Flushing queue...', queuedLogs.length, 'items');

  const fetchPromises = queuedLogs.map(async (log) => {
    try {
      const response = await fetch('/api/log-from-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log.data),
      });

      if (response.ok) {
        // If successful, remove from queue
        await deleteFromQueue(log.id);
        console.log('[SW] Flushed item successfully:', log.id);
      } else {
        console.error('[SW] Flush failed for item:', log.id, 'Status:', response.status);
      }
    } catch (error) {
      console.error('[SW] Network error during flush for item:', log.id, error);
      // Do not delete, will retry on next sync
    }
  });
  
  await Promise.all(fetchPromises);
}

// The main function to handle a log action from a notification
async function handleLog(data) {
  // Always queue first to ensure data is not lost
  await addToQueue({ data });

  // Then, try to sync in the background
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register('log-sync');
      console.log('[SW] Background sync registered for log-sync');
    } catch (err) {
      console.error('[SW] Background sync registration failed:', err);
      // If registration fails, we'll have to rely on the next app open to flush
      // but we will still try to flush immediately if online.
      return flushQueue();
    }
  } else {
    // If background sync is not supported, just try to flush immediately.
    // The data is already in IDB, so it's safe.
    return flushQueue();
  }
}

// Listen for sync events to process the queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'log-sync') {
    console.log('[SW] Sync event received for log-sync');
    event.waitUntil(flushQueue());
  }
});


// Listen for messages from the client to schedule notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_MOMENT') {
    const { payload } = event.data;
    console.log('[SW] Received SCHEDULE_MOMENT:', payload);
    event.waitUntil(scheduleNotifications(payload));
  }
});

async function scheduleNotifications(payload) {
  // Check for TimestampTrigger support
  if (!('TimestampTrigger' in self)) {
    console.warn('[SW] Notification Triggers not supported. Skipping schedule.');
    return;
  }

  const { momentId, userId, dateStr, plannedAtMs, label, habit, url } = payload;
  const nudgeAt = plannedAtMs - 5 * 60 * 1000;
  const checkAt = plannedAtMs + 5 * 60 * 1000;

  // Clear any existing notifications for this moment to avoid duplicates
  const notifications = await self.registration.getNotifications({ includeTriggered: true });
  notifications.forEach(notif => {
    if (notif.tag && notif.tag.startsWith(`moment:${momentId}:`)) {
      notif.close();
    }
  });

  const nudgeNotificationPromise = self.registration.showNotification('A Moment of Choice', {
    body: `Your planned smoke for '${label}' is in 5 minutes. Is this what you truly want?`,
    data: { url },
    showTrigger: new self.TimestampTrigger(nudgeAt),
    tag: `moment:${momentId}:nudge`,
  });

  const checkinNotificationPromise = self.registration.showNotification(`Checking In: ${label}`, {
    body: 'The moment has passed. Did you end up smoking?',
    actions: [
      { action: 'log_yes', title: 'Yes, I smoked' },
      { action: 'log_no', title: 'No, I skipped it!' },
    ],
    data: { url, userId, momentId, dateStr, habit },
    showTrigger: new self.TimestampTrigger(checkAt),
    tag: `moment:${momentId}:checkin`,
  });

  await Promise.all([nudgeNotificationPromise, checkinNotificationPromise]);
  console.log(`[SW] Scheduled nudge and check-in for moment ${momentId}`);
}


// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { action } = event;
  const data = event.notification.data || {};

  // If the user clicks the body of the notification (not an action button)
  if (!action) {
    event.waitUntil(clients.openWindow(data.url || '/'));
    return;
  }

  // Only handle our specific actions
  if (action !== 'log_yes' && action !== 'log_no') {
    return;
  }
  
  const logData = {
    userId: data.userId,
    momentId: data.momentId,
    dateStr: data.dateStr,
    smoked: action === 'log_yes',
    habit: data.habit
  };

  console.log('[SW] Notification action clicked:', logData);
  event.waitUntil(handleLog(logData));
});

// Immediately claim clients and take control of the page.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
