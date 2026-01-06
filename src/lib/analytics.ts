
// This ensures the code can run on the client
'use client';

// Define the gtag function on the window object for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'event',
      action: string,
      params: {
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
  }
}

/**
 * Sends a custom event to Google Analytics.
 * This is a wrapper around the gtag event command.
 *
 * @param {string} action - The name of the event (e.g., 'login', 'purchase').
 * @param {string} category - The category of the event (e.g., 'Engagement', 'Ecommerce').
 * @param {string} [label] - An optional label for the event (e.g., 'User clicks on button X').
 * @param {number} [value] - An optional numeric value associated with the event (e.g., price).
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  // Check if gtag is available on the window object
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } else {
    // Log a warning if gtag is not found, useful for debugging
    console.warn(`[Analytics] gtag not found. Event "${action}" was not sent.`);
  }
};
