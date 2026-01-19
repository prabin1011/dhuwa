
import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, unstable_setRequestLocale} from 'next-intl/server';
import {i18n, type Locale} from '@/i18n';
import { notFound } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { ThemeProvider } from '@/components/theme-provider';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{locale: Locale}>;
}) {

  const { locale } = await params;
  if (!i18n.locales.includes(locale)) notFound();

  // Enable server-side rendering for this locale
  unstable_setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* PWA Manifest & Theme */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111317" />
        
        {/* Favicon Links */}
        <link rel="icon" href="/1080x1080.png" type="image/png" />
        <link rel="apple-touch-icon" href="/1080x1080.png" />


        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-PJ8R05LFX9"></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PJ8R05LFX9');
          `}
        </Script>
      </head>
       <body suppressHydrationWarning className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <FirebaseClientProvider>
              {children}
            </FirebaseClientProvider>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
