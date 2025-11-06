import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import type { Locale } from '@/lib/i18n';
import { unwrapParams } from '../_lib/unwrapParams';

const locales: Locale[] = ['en', 'nb'];

export default async function LocaleLayout(
  props: {
    children: ReactNode;
    params: { locale: Locale } | Promise<{ locale: Locale }>;
  }
) {
  const { locale } = await unwrapParams((props as any).params);
  if (!locales.includes(locale)) notFound();

  let messages: Record<string, string>;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {props.children}
    </NextIntlClientProvider>
  );
}
