
import {redirect} from 'next/navigation';
import {type Locale} from '@/i18n';

// Helper function to resolve params whether they are a promise or not
async function unwrapParams<T>(p: T | Promise<T>): Promise<T> {
  return (p as any)?.then ? await (p as any) : (p as T);
}

export default async function LocaleIndexPage(props: {
  params: {locale: Locale} | Promise<{locale: Locale}>;
}) {
  const {locale} = await unwrapParams(props.params);
  redirect(`/${locale}/dashboard`);
}
