
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
import { LifeBuoy, LogOut, FileText, Info, User as UserIcon, Book, Feather, Send } from "lucide-react";
import { ProfileSheet } from '../profile/profile-sheet';
import type { WithId } from '@/firebase';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [isProfileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }
  
  const handleTestNotification = async () => {
    toast({ title: 'Sending...', description: 'Sending a test notification to your device.' });
    try {
        const res = await fetch('/api/send-reminders', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send.');
        toast({ title: 'Sent!', description: `Server reported ${data.notificationsSent || 0} notification(s) sent.`});
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Send Failed', description: e.message });
    }
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
          <DropdownMenuItem onSelect={handleTestNotification}>
            <Send className="mr-2 h-4 w-4" />
            <span>Test Notification</span>
          </DropdownMenuItem>
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
