
// Dhuwa - Offline-First Service Worker

const DB_NAME = 'dhuwa-log-queue';
const STORE_NAME = 'log-queue';
const SYNC_TAG = 'log-queue-sync';

// --- IndexedDB Queue Helpers ---

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function enqueueLog(entry) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(entry);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllLogs() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function deleteLog(id) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue() {
    try {
        const items = await getAllLogs();
        if (!items.length) return;

        for (const item of items) {
            try {
                const res = await fetch('/api/log-from-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-SW-Request': 'true' },
                    body: JSON.stringify(item.payload),
                });
                if (res.ok) {
                    await deleteLog(item.id);
                } else if (res.status >= 400 && res.status < 500) {
                    console.error('[SW] Server rejected log, discarding:', item.id, await res.json());
                    await deleteLog(item.id); // Discard bad request
                } else {
                    // Server error, keep in queue and retry later
                    break;
                }
            } catch (e) {
                // Network error, keep in queue and retry later
                break;
            }
        }
    } catch(e) {
        console.error("[SW] Error flushing queue:", e);
    }
}


// --- Notification Scheduling ---

const reminderTemplates = {
    nudge: {
        title: "A Moment of Choice",
        body: "Your planned smoke for '{{label}}' is in 5 minutes. Is this what you truly want, or is it just the habit talking?"
    },
    checkin: {
        title: "Checking In: '{{label}}'",
        body: "The moment has passed. Did you end up smoking?"
    }
};

async function closeByPrefix(prefix) {
  const notifs = await self.registration.getNotifications({ includeTriggered: true });
  for (const n of notifs) {
    if (typeof n.tag === 'string' && n.tag.startsWith(prefix)) {
      n.close();
    }
  }
}

async function scheduleNotifications(payload) {
  const { momentId, userId, dateStr, plannedAtMs, label, url, habit } = payload;
  const now = Date.now();

  const TT = self.TimestampTrigger;
  if (!TT) {
    console.warn('[SW] Notification Triggers not supported on this browser.');
    return;
  }

  // Define time for the two notifications
  const nudgeAt = plannedAtMs - 5 * 60 * 1000;
  const checkAt = plannedAtMs + 5 * 60 * 1000;

  // Clear any previously scheduled notifications for this moment to prevent duplicates
  const baseTag = `moment:${momentId}:${dateStr}`;
  await closeByPrefix(baseTag);

  const nudgeTag = `${baseTag}:nudge`;
  const checkinTag = `${baseTag}:checkin`;

  const nudgeBody = reminderTemplates.nudge.body.replace('{{label}}', label);
  if (nudgeAt > now) {
    await self.registration.showNotification(reminderTemplates.nudge.title, {
      body: nudgeBody,
      data: { url, userId, momentId, dateStr, habit },
      showTrigger: new TT(nudgeAt),
      tag: nudgeTag,
    });
  }
  
  const checkinBody = reminderTemplates.checkin.body.replace('{{label}}', label);
  if (checkAt > now) {
      await self.registration.showNotification(reminderTemplates.checkin.title, {
        body: checkinBody,
        actions: [
          { action: "log_yes", title: "Yes, I smoked" },
          { action: "log_no", title: "No, I skipped it!" },
        ],
        data: { url, userId, momentId, dateStr, habit },
        showTrigger: new TT(checkAt),
        tag: checkinTag,
        renotify: true,
      });
  }
}

// --- Service Worker Event Listeners ---

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => flushQueue())
  );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SCHEDULE_MOMENT') {
        event.waitUntil(scheduleNotifications(event.data.payload));
    }
    if (event.data?.type === 'FLUSH_QUEUE') {
        event.waitUntil(flushQueue());
    }
});

self.addEventListener('notificationclick', (event) => {
  const { action } = event;
  const data = event.notification.data || {};
  const { url, userId, momentId, dateStr, habit } = data;

  event.notification.close();

  if (!action) {
    event.waitUntil(clients.openWindow(url || '/'));
    return;
  }

  if (action === 'log_yes' || action === 'log_no') {
    const smoked = action === 'log_yes';

    const payload = { userId, momentId, dateStr, smoked, habit };
    const entry = {
      id: `${momentId}:${dateStr}:${Date.now()}`, // unique ID
      payload,
      createdAt: Date.now(),
    };

    event.waitUntil((async () => {
      // 1. Always queue locally first.
      await enqueueLog(entry);

      // 2. Register for a background sync to flush the queue.
      if (self.registration.sync) {
        try {
          await self.registration.sync.register(SYNC_TAG);
        } catch (syncErr) {
          console.error('[SW] Background Sync registration failed:', syncErr);
        }
      }
      
      // 3. Attempt an immediate flush as a best-effort.
      // This will succeed if the user is online.
      await flushQueue();

    })());
  }
});

// Sync event for flushing the queue when network is restored.
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});
