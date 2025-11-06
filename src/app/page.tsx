
import {redirect} from 'next/navigation';
import {i18n} from '@/i18n';

// This is the root page, which is not internationalized.
// It redirects to the default locale's landing page.
export default function RootPage() {
  redirect(i18n.defaultLocale);
}
