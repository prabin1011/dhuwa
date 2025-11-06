
import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, unstable_setRequestLocale} from 'next-intl/server';
import {i18n, type Locale} from '@/i18n';
import { notFound } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: ReactNode;
  params: {locale: Locale};
}) {

  if (!i18n.locales.includes(locale)) notFound();

  // Enable server-side rendering for this locale
  unstable_setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
       <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
