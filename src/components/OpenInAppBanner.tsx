'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_DISMISSED = 'dhuwa_open_in_app_dismissed_v1';
const STORAGE_SHOWN_AT = 'dhuwa_open_in_app_shown_at_v1';
const STORAGE_PAGEVIEWS = 'dhuwa_open_in_app_pv_v1';

const MIN_PAGEVIEWS_BEFORE_SHOW = 2;
const SHOW_DELAY_MS = 4500;                 // wait 4.5s
const COOLDOWN_DAYS = 7;                    // don’t show again for 7 days if they saw it

function daysSince(ts: number) {
  if (!ts) return Infinity;
  const ms = Date.now() - ts;
  return ms / (1000 * 60 * 60 * 24);
}


function isAndroid(ua: string) {
  return /Android/i.test(ua);
}

// If you're already inside the installed PWA/TWA, don't show banner
function isStandalone() {
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
    const path = window.location.pathname;
    const qs = window.location.search || '';

    // intent://<HOST><PATH>?<QS>#Intent;scheme=https;package=<PKG>;S.browser_fallback_url=<PLAY>;end
    return `intent://${CANONICAL_HOST}${path}${qs}#Intent;scheme=https;package=${pkg};S.browser_fallback_url=${encodeURIComponent(
      playStoreUrl
    )};end`;
  }, [playStoreUrl, pkg]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isMobile = /Mobile/i.test(ua);

    // basic eligibility
    if (!isAndroid(ua) || !isMobile) return;
    if (isStandalone()) return;

    // dismissed permanently
    const dismissed = localStorage.getItem(STORAGE_DISMISSED) === '1';
    if (dismissed) return;

    // pageview gating
    const pv = Number(localStorage.getItem(STORAGE_PAGEVIEWS) || '0') + 1;
    localStorage.setItem(STORAGE_PAGEVIEWS, String(pv));
    if (pv < MIN_PAGEVIEWS_BEFORE_SHOW) return;

    // cooldown gating (if they’ve seen it recently)
    const lastShown = Number(localStorage.getItem(STORAGE_SHOWN_AT) || '0');
    if (lastShown && daysSince(lastShown) < COOLDOWN_DAYS) return;

    // delay before showing (feels less spammy)
    const t = window.setTimeout(() => {
      localStorage.setItem(STORAGE_SHOWN_AT, String(Date.now()));
      setShow(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      // Not now → just cooldown
      localStorage.setItem(STORAGE_SHOWN_AT, String(Date.now()));
    } catch {}
    setShow(false);
  };

  const openApp = () => {
    // Must be triggered by a user gesture (click/tap)
    window.location.href = intentUrl;
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">Open Dhuwa in the app</div>
          <div className="text-xs text-muted-foreground truncate">
            Faster, offline-first, reminders work best in the app.
          </div>
        </div>

        <button
          onClick={openApp}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium bg-primary text-primary-foreground"
        >
          Open
        </button>

        <a
          href={playStoreUrl}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium border"
        >
          Get
        </a>

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-xl px-2 py-1 text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
