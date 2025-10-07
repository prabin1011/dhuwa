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
import { LifeBuoy, LogOut, FileText, Info, User as UserIcon, Edit, ChevronRight, Book, Feather } from "lucide-react";
import { ProfileSheet } from '../profile/profile-sheet';
import type { WithId } from '@/firebase';
import { useRouter } from 'next/navigation';

interface UserProfile {
    username?: string;
}

interface UserProfileDropdownProps {
  userProfile: WithId<UserProfile>;
}

export function UserProfileDropdown({ userProfile }: UserProfileDropdownProps) {
  const auth = useAuth();
  const router = useRouter();
  const [isProfileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'G';
    return name.charAt(0).toUpperCase();
  }
  
  const isAnonymous = auth?.currentUser?.isAnonymous;

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
            <div className="flex flex-col">
              <p className="text-sm font-medium leading-none">{userProfile.username || 'Guest User'}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {auth?.currentUser?.email || 'Anonymous'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setProfileSheetOpen(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          {isAnonymous && (
             <Link href="/login" passHref>
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Register with Email</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                </DropdownMenuItem>
             </Link>
          )}
          <DropdownMenuSeparator />
           <a href="https://prakakura.com/journals" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground">
             <DropdownMenuItem>
                <Book className="mr-2 h-4 w-4" />
                <span>Write Journals</span>
             </DropdownMenuItem>
          </a>
          <a href="https://prakakura.com" target="_blank" rel="noopener noreferrer">
             <DropdownMenuItem>
                <Feather className="mr-2 h-4 w-4" />
                <span>Write into the Quiet</span>
             </DropdownMenuItem>
          </a>
          <DropdownMenuSeparator />
          <Link href="/about" passHref>
             <DropdownMenuItem>
                <Info className="mr-2 h-4 w-4" />
                <span>About Us</span>
             </DropdownMenuItem>
          </Link>
          <Link href="/terms" passHref>
            <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                <span>Terms & Conditions</span>
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

    