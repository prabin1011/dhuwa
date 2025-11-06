import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

export const i18n = {
  locales: ['en', 'nb'] as const,
  defaultLocale: 'en' as const
};
export type Locale = (typeof i18n)['locales'][number];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!i18n.locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
