
'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Trophy, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n';

const NAV_ITEMS = [
  { label: 'Home',          icon: Home,    href: '/dashboard' },
  { label: 'Community',     icon: Users,   href: '/community' },
  { label: 'Achievements',  icon: Trophy,  href: '/achievements' },
  { label: 'Profile',       icon: User,    href: '/profile' },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { locale } = useParams() as { locale: Locale };

  return (
    <nav className="flex items-center justify-around py-1">
      {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
        const fullHref = `/${locale}${href}`;
        const active = pathname === fullHref || (href !== '/dashboard' && pathname.startsWith(fullHref));

        return (
          <Link
            key={label}
            href={fullHref}
            className={cn(
              'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-150 active:scale-95',
              active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon className={cn('w-5 h-5 transition-all duration-150', active && 'scale-110')} strokeWidth={active ? 2.5 : 2} />
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className={cn('text-[10px] font-medium tracking-wide', active ? 'text-primary' : '')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
