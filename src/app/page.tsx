'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { i18n } from '@/lib/i18n';

export default function RootPage() {
  useEffect(() => {
    redirect(i18n.defaultLocale);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
