'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, MessageCircle, Sparkles } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chatbot', label: 'AI Coach', icon: MessageCircle },
  { href: '/journal', label: 'Urge Journal', icon: BookOpen },
  { href: '/inspiration', label: 'Inspiration', icon: Sparkles },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="items-center justify-center text-center">
        <Link href="/" className="block group-data-[collapsible=icon]:hidden">
          <h1 className="font-headline text-2xl font-bold text-primary">The Easy Way Out</h1>
        </Link>
         <Link href="/" className="hidden group-data-[collapsible=icon]:block">
          <svg role="img" aria-label="The Easy Way Out Logo" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.06 13.5L8.4 12.94l1.41-1.41 1.15 1.14 3.54-3.54 1.41 1.41L10.94 15.5z" /></svg>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <a className={cn('flex items-center gap-3')}>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
