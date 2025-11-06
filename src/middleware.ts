import createMiddleware from 'next-intl/middleware';
import { i18n } from '@/lib/i18n';

export default createMiddleware({
  ...i18n,
  locales: i18n.locales,
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'as-needed'
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};