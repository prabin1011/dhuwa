import { redirect } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { unwrapParams } from '../_lib/unwrapParams';

export default async function LocaleIndexPage(
  props: { params: { locale: Locale } } | { params: Promise<{ locale: Locale }> }
) {
  const { locale } = await unwrapParams((props as any).params);
  redirect(`/${locale}/dashboard`);
}
