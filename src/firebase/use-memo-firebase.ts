'use client';

import { useMemo, type DependencyList } from 'react';

/**
 * Custom hook to memoize Firebase queries or references.
 * It's a lightweight wrapper around React's useMemo that includes
 * a marker to help with debugging and ensuring it's used correctly.
 *
 * @template T The type of the value being memoized (e.g., Query, DocumentReference).
 * @param {() => T} factory - The function that creates the Firebase object.
 * @param {DependencyList} deps - The dependency array for the memoization.
 * @returns {T} The memoized Firebase object.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);

  // Attach a marker to the memoized object. This helps the useCollection/useDoc
  // hooks verify that the reference was properly memoized, preventing infinite loops.
  if (value && typeof value === 'object') {
    (value as any).__memo = true;
  }

  return value;
}
