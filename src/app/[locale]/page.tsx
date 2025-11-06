'use client';

import { useUser } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import type { Locale } from '@/lib/i18n';

export default function LocaleRootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;

  useEffect(() => {
    if (!isUserLoading && locale) {
      if (user) {
        router.replace(`/${locale}/dashboard`);
      } else {
        router.replace(`/${locale}/login`);
      }
    }
  }, [user, isUserLoading, router, locale]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
