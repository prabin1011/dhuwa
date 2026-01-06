'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import type { Locale } from '@/i18n';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

export default function LandingPage() {
  const t = useTranslations('landing');
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { locale } = useParams() as { locale: Locale };

  useEffect(() => {
    // If the user is loaded and authenticated, redirect to the dashboard.
    if (!isUserLoading && user) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, isUserLoading, router, locale]);

  // While checking auth state, show a loading UI.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-24 w-24 text-primary" />
          <Skeleton className="h-6 w-48 mt-4" />
        </div>
      </div>
    );
  }

  // Only render the landing page if the user is not logged in.
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Logo className="h-8 w-8" />
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href={`/${locale}/login`}>{t('signIn')}</Link>
              </Button>
              <Button asChild>
                <Link href={`/${locale}/login`}>{t('getStarted')}</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <Logo className="h-24 w-24 text-primary" />
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
             <p className="max-w-[700px] text-base text-muted-foreground/80 italic">
                Prefer to write? You can journal your thoughts privately through <a href="https://prakakura.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Prakakura</a>.
            </p>
          </div>
          <div className="mx-auto flex gap-4">
            <Button asChild size="lg">
              <Link href={`/${locale}/login`}>{t('getStarted')}</Link>
            </Button>
          </div>
        </section>

        <section className="container max-w-4xl py-12">
            <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">{t('missionTitle')}</h2>
                    <p className="text-muted-foreground">{t('missionText1')}</p>
                    <p className="text-muted-foreground">{t('missionText2')}</p>
                </div>
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold">{t('visionTitle')}</h2>
                    <p className="text-muted-foreground">{t('visionText1')}</p>
                    <p className="text-muted-foreground">{t('visionText2')}</p>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
                <Logo className="h-6 w-6" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                 <Link href={`/${locale}/about`} className="hover:text-foreground">About</Link>
                 <Link href={`/${locale}/features`} className="hover:text-foreground">Features</Link>
                 <Link href={`/${locale}/faq`} className="hover:text-foreground">FAQ</Link>
                 <Link href={`/${locale}/contact`} className="hover:text-foreground">Contact</Link>
                 <Link href={`/${locale}/privacy`} className="hover:text-foreground">Privacy</Link>
                 <Link href={`/${locale}/terms`} className="hover:text-foreground">Terms</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
