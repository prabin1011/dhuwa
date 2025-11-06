import createMiddleware from 'next-intl/middleware';
import { i18n } from './lib/i18n';

export default createMiddleware({
  locales: i18n.locales as unknown as string[],
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
});

export const config = {
  // Skip all paths that should not be internationalized. This example skips the
  // folders "api", "_next" and all files with an extension (e.g. favicon.ico)
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
