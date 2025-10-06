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
import { LifeBuoy, LogOut, FileText, Info, User as UserIcon } from "lucide-react";
import { ProfileSheet } from '../profile/profile-sheet';
import type { WithId } from '@/firebase';

interface UserProfile {
    username?: string;
}

interface UserProfileDropdownProps {
  userProfile: WithId<UserProfile>;
}

export function UserProfileDropdown({ userProfile }: UserProfileDropdownProps) {
  const auth = useAuth();
  const [isProfileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'G';
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
              <p className="text-sm font-medium leading-none">{userProfile.username || 'Guest User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {auth?.currentUser?.email || 'Anonymous'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setProfileSheetOpen(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
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
