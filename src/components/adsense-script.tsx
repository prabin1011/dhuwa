
'use client';

import Script from 'next/script';
import { usePwa } from '@/hooks/use-pwa';

export function AdSenseScript() {
  const isPwa = usePwa();

  // Only render the AdSense script if the app is NOT running as a PWA (i.e., in a regular browser tab)
  if (isPwa) {
    return null;
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4763546734673201"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
