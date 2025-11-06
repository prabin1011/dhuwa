import type { ReactNode } from 'react';
import './globals.css';

// This is now the root layout and must contain <html> and <body>
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
