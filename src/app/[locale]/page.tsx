import { redirect } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

// IMPORTANT: no "use client" here, no React hooks.
export default async function LocaleIndexPage(
  props: { params: Promise<{ locale: Locale }> }
) {
  const { locale } = await props.params;      // Next 15.3+ requires await
  redirect(`/${locale}/dashboard`);           // server-side redirect
}
