import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import type { Locale } from '@/i18n';
import { unwrapParams } from '../_lib/unwrapParams';

export default function LocaleLayout(props: {
  children: ReactNode;
  params: { locale: Locale } | Promise<{ locale: Locale }>;
}) {
  const messages = useMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {props.children}
    </NextIntlClientProvider>
  );
}
