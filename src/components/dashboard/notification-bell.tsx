
'use client';

import { useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import type { MessagePayload } from 'firebase/messaging';
import { format } from 'date-fns';

interface NotificationBellProps {
  messages: MessagePayload[];
  clearMessages: () => void;
}

export function NotificationBell({ messages, clearMessages }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Clear messages when the sheet is closed
      clearMessages();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5" />
          {messages.length > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {messages.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="py-4 flex-1 overflow-y-auto">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={msg.messageId || index} className="p-3 rounded-md bg-secondary">
                  <p className="font-semibold text-sm">{msg.notification?.title}</p>
                  <p className="text-xs text-secondary-foreground">{msg.notification?.body}</p>
                   {msg.sentTime && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(Number(msg.sentTime)), 'p, MMM d')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No new notifications.</p>
            </div>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={clearMessages} disabled={messages.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
