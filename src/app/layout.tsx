import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Dhuwa – Quit Smoking Companion App | Balance, Freedom, Life',
  description: 'Dhuwa is a mindful companion app to understand smoking triggers, track urges, and rediscover balance. Built with poetry and science, not willpower.',
  keywords: ['quit smoking app', 'mindful quitting', 'smoking triggers', 'smoking journal', 'nicotine-free journey', 'smoking alternatives', 'quit smoking support', 'smoking balance app'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-grammarly="false">
      <head>
        <meta name="grammarly" content="false" />
      </head>
      <body suppressHydrationWarning data-grammarly="false">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
