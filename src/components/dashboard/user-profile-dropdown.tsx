
'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/firebase";
import Link from 'next/link';
import { Button } from "../ui/button";
import { LifeBuoy, LogOut, FileText, Info, User as UserIcon, Book, Feather, MessageSquare, Shield, HelpCircle, Users, Watch } from "lucide-react";
import { ProfileSheet } from '../profile/profile-sheet';
import type { WithId } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import type { User } from 'firebase/auth';
import type { Locale } from '@/i18n';

interface UserProfile {
    username?: string;
}

interface UserProfileDropdownProps {
  user: User;
  userProfile: WithId<UserProfile>;
}

export function UserProfileDropdown({ user, userProfile }: UserProfileDropdownProps) {
  const auth = useAuth();
  const router = useRouter();
  const {locale} = useParams() as {locale: Locale};

  const [isProfileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push(`/${locale}/login`);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(userProfile.username)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userProfile.username || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setProfileSheetOpen(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
           <Link href={`/${locale}/community`}>
             <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" />
                <span>Community</span>
             </DropdownMenuItem>
          </Link>
           <a href="https://prakakura.com/journals" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
             <DropdownMenuItem>
                <Book className="mr-2 h-4 w-4" />
                <span>Write Journals</span>
             </DropdownMenuItem>
          </a>
          <a href="https://prakakura.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
             <DropdownMenuItem>
                <Feather className="mr-2 h-4 w-4" />
                <span>Write into the Quiet</span>
             </DropdownMenuItem>
          </a>
          <DropdownMenuSeparator />
          <Link href={`/${locale}/about`}>
             <DropdownMenuItem>
                <Info className="mr-2 h-4 w-4" />
                <span>About Us</span>
             </DropdownMenuItem>
          </Link>
           <Link href={`/${locale}/features`}>
             <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Features</span>
             </DropdownMenuItem>
          </Link>
           <Link href={`/${locale}/faq`}>
             <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>FAQ</span>
             </DropdownMenuItem>
          </Link>
           <Link href={`/${locale}/contact`}>
             <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Contact Us</span>
             </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <Link href={`/${locale}/terms`}>
            <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>Terms & Conditions</span>
            </DropdownMenuItem>
          </Link>
           <Link href={`/${locale}/privacy`}>
            <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                <span>Privacy Policy</span>
            </DropdownMenuItem>
          </Link>
           <Link href={`/${locale}/disclaimer`}>
            <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                <span>Disclaimer</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileSheet isOpen={isProfileSheetOpen} onOpenChange={setProfileSheetOpen} userProfile={userProfile} />
    </>
  );
}
