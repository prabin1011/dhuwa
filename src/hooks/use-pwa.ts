
'use client';

import { useState, useEffect } from 'react';

/**
 * A hook to determine if the app is running in standalone mode (as an installed PWA).
 * @returns {boolean} True if the app is a PWA, false otherwise.
 */
export function usePwa() {
  // Default to false, assuming it's not a PWA until the client-side check runs.
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, where `window` is available.
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwa(true);
    }
  }, []);

  return isPwa;
}
