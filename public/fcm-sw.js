// --- Self-management: Install and activate the service worker ---
self.addEventListener('install', (event) => {
  // skipWaiting forces the waiting service worker to become the active service worker.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // clients.claim() allows an active service worker to set itself as the controller for all clients within its scope.
  event.waitUntil(self.clients.claim());
});


// --- IndexedDB Queue for Offline Logging ---
const DB_NAME = 'dhuwa-log-queue';
const STORE = 'queue';
const SYNC_TAG = 'log-queue';

/**
 * Opens and initializes the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Adds or updates an entry in the log queue.
 * @param {object} entry - The log entry to queue.
 * @returns {Promise<boolean>} A promise that resolves when the operation is complete.
 */
async function enqueueLog(entry) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves all log entries from the queue.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of log entries.
 */
async function getAllLogs() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deletes a log entry from the queue by its ID.
 * @param {string} id - The ID of the log entry to delete.
 * @returns {Promise<boolean>} A promise that resolves when the deletion is complete.
 */
async function deleteLog(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Attempts to flush the log queue by sending entries to the server.
 * It stops on the first network failure to preserve order and prevent spamming.
 */
async function flushQueue() {
  const items = await getAllLogs();
  if (!items.length) return;

  for (const item of items) {
    try {
      const res = await fetch('/api/log-from-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        // If the server successfully processed the log, remove it from the local queue.
        await deleteLog(item.id);
      } else {
        // If the server returns an error (e.g., 4xx, 5xx), stop processing to avoid sending bad data.
        console.error(`[SW] Server rejected log item ${item.id} with status ${res.status}`);
        break;
      }
    } catch (e) {
      // This catches network errors (e.g., offline). Stop processing and retry later.
      console.log(`[SW] Network error during flush. Will retry later.`);
      break;
    }
  }
}

// --- Service Worker Event Listeners ---

/**
 * Handles the 'sync' event, triggered by the Background Sync API.
 * This is the primary mechanism for processing the offline queue when network is restored.
 */
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});

/**
 * Handles clicks on notifications, including custom actions.
 */
self.addEventListener('notificationclick', (event) => {
  const { action } = event;
  const data = event.notification.data || {};
  const { url, userId, momentId, dateStr, habit } = data;

  event.notification.close();

  // If the user clicks the body of the notification, open the app.
  if (!action) {
    event.waitUntil(clients.openWindow(url || '/'));
    return;
  }

  // If the click was on a "log" action button.
  if (action === 'log_yes' || action === 'log_no') {
    const smoked = action === 'log_yes';

    // Prepare the data payload for the API.
    const payload = { userId, momentId, dateStr, smoked, habit };
    const entry = {
      id: `${momentId}:${dateStr}:${Date.now()}`, // Create a unique ID for the queue entry.
      payload,
      createdAt: Date.now(),
    };

    event.waitUntil((async () => {
      // 1. Always store the action locally first. This guarantees it's not lost.
      await enqueueLog(entry);

      // 2. If Background Sync is supported, register a sync task.
      if (self.registration.sync) {
        try { await self.registration.sync.register(SYNC_TAG); } catch (err) {
          console.error('[SW] Could not register sync:', err);
        }
      }

      // 3. Attempt to flush the queue immediately as a best-effort.
      // If online, this provides instant feedback. If offline, it does nothing.
      await flushQueue();
    })());
  }
});

/**
 * Listens for messages from the main application to schedule notifications.
 */
self.addEventListener("message", (event) => {
    if (event.data?.type !== "SCHEDULE_MOMENT") return;
    
    // Wrap in waitUntil to ensure the service worker stays active while scheduling.
    event.waitUntil(scheduleNotifications(event.data.payload));
});

/**
 * Schedules the "nudge" and "check-in" notifications for a planned moment.
 * @param {object} payload - The details of the moment to schedule.
 */
async function scheduleNotifications(payload) {
    const { momentId, userId, dateStr, plannedAtMs, label, habit, url } = payload;
    const now = Date.now();
    
    // Guard: Check if Notification Triggers are supported in the current browser.
    const TT = self.TimestampTrigger || (typeof TimestampTrigger !== 'undefined' ? TimestampTrigger : null);
    if (!TT) {
        console.warn('[SW] Notification Triggers not supported. Skipping schedule.');
        return;
    }
    
    // Clear any previously scheduled notifications for this specific moment to avoid duplicates.
    const existingNotifs = await self.registration.getNotifications({ tag: `moment:${momentId}:${dateStr}` });
    existingNotifs.forEach(notif => notif.close());

    // Define the templates for our two notifications.
    const reminderTemplates = {
        nudge: {
            title: "A Moment of Choice",
            body: `Your planned smoke for '${label}' is in 5 minutes. Is this what you truly want?`
        },
        checkin: {
            title: `Checking In: ${label}`,
            body: "The moment has passed. Did you end up smoking?"
        }
    };
    
    const nudgeAt = plannedAtMs - 5 * 60 * 1000;   // 5 minutes before
    const checkAt = plannedAtMs + 5 * 60 * 1000;   // 5 minutes after

    // Only schedule the nudge notification if its planned time is in the future.
    if (nudgeAt > now) {
         await self.registration.showNotification(reminderTemplates.nudge.title, {
            body: reminderTemplates.nudge.body,
            data: { url, userId, momentId, dateStr, habit },
            showTrigger: new TT(nudgeAt),
            tag: `moment:${momentId}:${dateStr}`, // Unique tag for this specific moment and day
        });
    }

    // Only schedule the check-in notification if its planned time is in the future.
    if (checkAt > now) {
        await self.registration.showNotification(reminderTemplates.checkin.title, {
            body: reminderTemplates.checkin.body,
            actions: [
                { action: "log_yes", title: "Yes, I smoked" },
                { action: "log_no", title: "No, I skipped it!" },
            ],
            data: { url, userId, momentId, dateStr, habit },
            showTrigger: new TT(checkAt),
            tag: `moment:${momentId}:${dateStr}`, // Re-use tag to replace the nudge notification
            renotify: true,
        });
    }
}
