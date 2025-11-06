import { ReactNode } from 'react';
import './globals.css';

// This is now the root layout and must contain <html> and <body>
export default function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale || 'en';
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
