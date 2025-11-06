import {redirect} from 'next/navigation';
import {type Locale} from '@/i18n';
import { unwrapParams } from '../_lib/unwrapParams';

export default async function LocaleIndexPage(props: {
  params: {locale: Locale} | Promise<{locale: Locale}>;
}) {
  const {locale} = await unwrapParams(props.params);
  redirect(`/${locale}/dashboard`);
}
