// Dhuwa Service Worker for Local Scheduled Notifications & Offline Logging

const NUDGE_OFFSET = -5 * 60 * 1000; // 5 minutes before
const CHECKIN_OFFSET = 5 * 60 * 1000; // 5 minutes after
const DB_NAME = 'dhuwa-log-queue';
const STORE_NAME = 'log_queue';
const SYNC_TAG = 'log-queue-sync';

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


// --- IndexedDB Queue for Offline Logging ---

function openDb() {
  return new Promise((resolve, reject) => {
    const request = self.indexedDB.open(DB_NAME, 1);
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
  const request = tx.objectStore(STORE_NAME).getAll();
  return new Promise((resolve, reject) => {
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
            const res = await fetch('/api/log-from-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload),
            });

            if (res.ok) {
                await deleteLog(item.id);
            } else {
                 // Stop if server rejects, to avoid spamming a bad request
                 break;
            }
        }
    } catch (e) {
        // This will typically be a network error (offline)
        // We just stop and wait for the next sync/flush attempt.
        console.log('[SW] Flush failed, will retry later.', e.message);
    }
}


// --- Event Listeners ---

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim().then(() => flushQueue()));
});


self.addEventListener('message', (event) => {
  if (event.data?.type === "SCHEDULE_MOMENT") {
    event.waitUntil(scheduleNotifications(event.data.payload));
  }
  if (event.data?.type === "FLUSH_QUEUE") {
    event.waitUntil(flushQueue());
  }
});


self.addEventListener('notificationclick', (event) => {
  const { action } = event;
  const data = event.notification.data || {};
  const { url, userId, momentId, dateStr, habit } = data;
  event.notification.close();

  // Validate required data before proceeding
  if (action && (!userId || !momentId || !dateStr)) {
    console.error('[SW] Missing required data for log action.', data);
    return;
  }
  
  // If the body is clicked, just open the app.
  if (!action) {
    event.waitUntil(self.clients.openWindow(url || '/'));
    return;
  }

  if (action === 'log_yes' || action === 'log_no') {
    const smoked = action === 'log_yes';
    const entry = {
      id: `${momentId}:${dateStr}:${Date.now()}`, // Unique ID for the log entry
      payload: { userId, momentId, dateStr, smoked, habit },
      createdAt: Date.now(),
    };

    event.waitUntil((async () => {
      await enqueueLog(entry);
      if (self.registration.sync) {
        try { await self.registration.sync.register(SYNC_TAG); } catch {}
      }
      await flushQueue(); // Best-effort immediate flush
    })());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});

async function closeByPrefix(prefix) {
    try {
        const notifs = await self.registration.getNotifications({ includeTriggered: true });
        for (const n of notifs) {
            if (typeof n.tag === 'string' && n.tag.startsWith(prefix)) {
                n.close();
            }
        }
    } catch(e) {
        console.error('[SW] Error getting notifications to close:', e);
    }
}


async function scheduleNotifications(payload) {
  const { momentId, userId, dateStr, plannedAtMs, label, url, habit } = payload;
  const TT = self.TimestampTrigger;
  if (!TT) {
      console.warn("[SW] Notification Triggers not supported.");
      return;
  }
  const now = Date.now();
  const baseTag = `moment:${momentId}:${dateStr}`;
  await closeByPrefix(baseTag);

  const nudgeAt = plannedAtMs + NUDGE_OFFSET;
  const checkAt = plannedAtMs + CHECKIN_OFFSET;

  if (nudgeAt > now) {
      await self.registration.showNotification(
          reminderTemplates.nudge.title.replace('{{label}}', label), {
          body: reminderTemplates.nudge.body.replace('{{label}}', label),
          data: { url, userId, momentId, dateStr, habit },
          showTrigger: new TT(nudgeAt),
          tag: `${baseTag}:nudge`,
      });
  }

  if (checkAt > now) {
      await self.registration.showNotification(
          reminderTemplates.checkin.title.replace('{{label}}', label), {
          body: reminderTemplates.checkin.body.replace('{{label}}', label),
          actions: [
              { action: "log_yes", title: "Yes, I smoked" },
              { action: "log_no", title: "No, I skipped it!" },
          ],
          data: { url, userId, momentId, dateStr, habit },
          showTrigger: new TT(checkAt),
          tag: `${baseTag}:checkin`,
          renotify: true,
      });
  }
}
