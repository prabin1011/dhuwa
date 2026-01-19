// Dhuwa - Offline-First Notification Service Worker

const DB_NAME = 'dhuwa-log-queue';
const STORE = 'queue';
const SYNC_TAG = 'log-queue';

// --- IndexedDB Queue for Offline Logging ---

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

async function enqueueLog(entry) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllLogs() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteLog(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// --- Queue Flushing Logic ---

async function flushQueue() {
  const items = await getAllLogs();
  if (!items.length) return;

  console.log(`[SW] Flushing ${items.length} items from queue.`);

  for (const item of items) {
    try {
      const res = await fetch('/api/log-from-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        await deleteLog(item.id);
        console.log(`[SW] Flushed and deleted log: ${item.id}`);
      } else {
        // Server rejected the request; stop so we don't spam.
        console.error(`[SW] Server rejected log ${item.id}, status: ${res.status}. Stopping flush.`);
        break;
      }
    } catch (e) {
      // Offline or network error — stop, keep queued.
      console.log('[SW] Network error during flush. Will retry later.', e.message);
      break;
    }
  }
}

// --- Notification Scheduling Logic ---

// Helper to safely close notifications by a tag prefix
async function closeByPrefix(prefix) {
  try {
    const notifs = await self.registration.getNotifications({ includeTriggered: true });
    for (const n of notifs) {
      if (typeof n.tag === 'string' && n.tag.startsWith(prefix)) {
        n.close();
      }
    }
  } catch (e) {
    console.error('[SW] Error clearing notifications:', e);
  }
}

// Main scheduling function
async function scheduleNotifications(payload) {
  // Use `self.TimestampTrigger` for robustness inside the worker
  const TT = self.TimestampTrigger || (self.clients ? self.TimestampTrigger : null);
  if (!TT) {
    console.warn('[SW] Notification Triggers not supported. Skipping schedule.');
    return;
  }

  const { momentId, userId, dateStr, plannedAtMs, label, habit, url } = payload;
  const now = Date.now();

  const nudgeAt = plannedAtMs - 5 * 60 * 1000;   // 8:55 for a 9:00 moment
  const checkAt = plannedAtMs + 1 * 60 * 1000;   // 9:01 for a 9:00 moment

  const baseTag = `moment:${momentId}:${dateStr}`;
  await closeByPrefix(baseTag); // Clear any old notifications for this moment

  // --- 1. Schedule "Nudge" Notification (-5 min) ---
  if (nudgeAt > now) {
    const nudgeTag = `${baseTag}:nudge`;
    await self.registration.showNotification("A Moment of Choice", {
      body: `Your planned smoke for '${label}' is in 5 minutes. Is this what you want?`,
      data: { url, userId, momentId, dateStr, habit }, // Pass data for click handling
      showTrigger: new TT(nudgeAt),
      tag: nudgeTag,
    });
  }

  // --- 2. Schedule "Check-in" Notification (+1 min) ---
  if (checkAt > now) {
    const checkinTag = `${baseTag}:checkin`;
    await self.registration.showNotification(`Checking In: ${label}`, {
      body: "Did you end up smoking?",
      actions: [
        { action: "log_yes", title: "Yes, I smoked" },
        { action: "log_no", title: "No, I skipped!" },
      ],
      data: { url, userId, momentId, dateStr, habit },
      showTrigger: new TT(checkAt),
      tag: checkinTag,
      renotify: true, // Allow re-notification if user didn't interact
    });
  }
}

// --- Service Worker Event Listeners ---

// On activate, claim clients and try to flush any pending logs
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    await flushQueue();
  })());
});

// Handle messages from the app (for scheduling and flushing)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_MOMENT") {
    event.waitUntil(scheduleNotifications(event.data.payload));
  }
  if (event.data?.type === "FLUSH_QUEUE") {
    event.waitUntil(flushQueue());
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  const { action } = event;
  const data = event.notification.data || {};
  const { url, userId, momentId, dateStr, habit } = data;

  event.notification.close();

  // If user just clicks the body of the notification, open the app
  if (!action) {
    event.waitUntil(clients.openWindow(url || '/'));
    return;
  }

  // If it's a "Yes" or "No" action
  if (action === 'log_yes' || action === 'log_no') {
    const smoked = action === 'log_yes';
    const payload = { userId, momentId, dateStr, smoked, habit };
    
    // Use a unique ID for the queue entry
    const entry = {
      id: `${momentId}:${dateStr}:${Date.now()}`,
      payload,
      createdAt: Date.now(),
    };

    event.waitUntil((async () => {
      // 1) Always store locally first to guarantee it's not lost
      await enqueueLog(entry);

      // 2) Register for a background sync to flush later (if supported)
      if (self.registration.sync) {
        try { await self.registration.sync.register(SYNC_TAG); } catch (e) {
          console.error('[SW] Background Sync registration failed:', e.message);
        }
      }

      // 3) Attempt a best-effort flush immediately
      await flushQueue();
    })());
  }
});

// Sync event for flushing the queue when network returns
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});
