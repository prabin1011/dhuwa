import createMiddleware from 'next-intl/middleware';
import { i18n } from '@/lib/i18n';

export default createMiddleware({
  ...i18n,
  // A list of all locales that are supported
  locales: i18n.locales,

  // Used when no locale matches
  defaultLocale: i18n.defaultLocale,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(no|en)/:path*'],
};
