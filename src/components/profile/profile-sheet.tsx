'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import type { WithId } from "@/firebase";

interface UserProfile {
    username?: string;
    // We will add all the other profile fields here later
}

interface ProfileSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userProfile: WithId<UserProfile>;
}

export function ProfileSheet({ isOpen, onOpenChange, userProfile }: ProfileSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your Profile</SheetTitle>
          <SheetDescription>
            View and edit your onboarding answers. Your progress is tied to this information.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
            <h3 className="text-lg font-semibold">{userProfile.username}</h3>
            <p className="text-sm text-muted-foreground">Here you will be able to see and edit all your onboarding questions and answers.</p>
            {/* Placeholder for the editable form */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
