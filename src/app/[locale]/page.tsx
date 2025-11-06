import { redirect } from 'next/navigation';
import { i18n, type Locale } from '@/lib/i18n';

// This page acts as the root for each language.
// It immediately redirects the user to their dashboard for that language.
// The auth guard is handled within the dashboard page itself.
export default function LocaleRootPage({
  params,
}: {
  params: { locale: Locale };
}) {
  redirect(`/${params.locale}/dashboard`);
}
