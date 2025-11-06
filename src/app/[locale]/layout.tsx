import { ReactNode } from 'react';

// This layout is now just a pass-through because the root layout
// at src/app/layout.tsx handles the main HTML structure and providers.
export default function LocaleLayout({ children }: { children: ReactNode }) {
  return children;
}