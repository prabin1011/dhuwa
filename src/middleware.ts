import createMiddleware from 'next-intl/middleware';
import { i18n } from './lib/i18n';

export default createMiddleware({
  locales: i18n.locales as unknown as string[],
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
