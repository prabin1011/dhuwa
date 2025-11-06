import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import type { Locale } from '@/lib/i18n';

// Can be imported from a shared config
const locales: Locale[] = ['en', 'nb'];

export default async function LocaleLayout({
  children,
  params: paramsPromise,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await paramsPromise;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FirebaseClientProvider>{children}</FirebaseClientProvider>
      <Toaster />
    </NextIntlClientProvider>
  );
}
