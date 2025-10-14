import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Dhuwa - AI Quit Smoking Coach',
  description: 'A mindful companion to help you understand your habits, find your balance, and reclaim your freedom from smoking.',
  keywords: ['quit smoking', 'stop smoking', 'smoking cessation', 'habit tracker', 'ai coach'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning data-grammarly="false">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
