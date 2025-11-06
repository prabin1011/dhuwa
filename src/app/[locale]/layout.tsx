import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {i18n, type Locale} from '@/i18n';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: {locale: Locale} | Promise<{locale: Locale}>;
}) {
  const p = await Promise.resolve(params);
  const locale = p.locale;

  if (!i18n.locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FirebaseClientProvider>
        {children}
      </FirebaseClientProvider>
      <Toaster />
    </NextIntlClientProvider>
  );
}
