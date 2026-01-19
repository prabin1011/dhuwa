'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'dhuwa_open_in_app_dismissed_v1';

function isAndroid(ua: string) {
  return /Android/i.test(ua);
}

// If you're already inside the installed PWA/TWA, don't show banner
function isStandalone() {
  // iOS: navigator.standalone, others: matchMedia
  // @ts-ignore
  const iosStandalone = typeof navigator !== 'undefined' && (navigator as any).standalone;
  const mql = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;
  const ref = typeof document !== 'undefined' ? document.referrer || '' : '';
  const isAndroidAppReferrer = ref.startsWith('android-app://');
  return !!iosStandalone || !!mql || isAndroidAppReferrer;
}

export default function OpenInAppBanner() {
  const [show, setShow] = useState(false);

  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.dhuwa.twa';
  const pkg = 'com.dhuwa.twa';

  const intentUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const CANONICAL_HOST = 'dhuwa.com'; // Use the canonical production host
    // Preserve the current path/query so the app opens the same route (TWA will load it)
    const path = window.location.pathname;
    const qs = window.location.search || '';

    // intent://<HOST>/<PATH>?<QS>#Intent;scheme=https;package=<PKG>;S.browser_fallback_url=<PLAY>;end
    return `intent://${CANONICAL_HOST}${path}${qs}#Intent;scheme=https;package=${pkg};S.browser_fallback_url=${encodeURIComponent(
      playStoreUrl
    )};end`;
  }, [playStoreUrl, pkg]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem(STORAGE_KEY) === '1';
    const ua = navigator.userAgent || '';
    const isMobile = /Mobile/i.test(ua);

    // Show only on Android mobile browsers, not inside installed standalone/TWA
    if (!dismissed && isAndroid(ua) && isMobile && !isStandalone()) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setShow(false);
  };

  const openApp = () => {
    // Must be triggered by a user gesture (click/tap)
    window.location.href = intentUrl;
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-[1000] rounded-2xl border bg-background/95 backdrop-blur p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold">Open Dhuwa in the app</div>
          <div className="text-xs text-muted-foreground mt-1">
            Faster, offline-first, and reminders work better in the app.
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={openApp}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground"
            >
              Open in app
            </button>
            <a
              href={playStoreUrl}
              className="rounded-xl px-4 py-2 text-sm font-medium border"
            >
              Get the app
            </a>
          </div>
        </div>

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-xl px-2 py-1 text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
