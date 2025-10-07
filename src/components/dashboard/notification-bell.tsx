
'use client';

import { useState, useEffect } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import type { MessagePayload } from 'firebase/messaging';
import { formatDistanceToNow, format } from 'date-fns';
import { useFirebase, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import { collection, writeBatch, doc, query, orderBy, limit } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';

interface StoredNotification {
  title: string;
  body: string;
  timestamp: Timestamp;
  read: boolean;
  link?: string;
}
interface NotificationBellProps {
  messages: MessagePayload[];
  clearMessages: () => void;
}

export function NotificationBell({ messages, clearMessages }: NotificationBellProps) {
  const { firestore, user } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `users/${user.uid}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(20)
    );
  }, [firestore, user]);

  const { data: storedNotifications } = useCollection<StoredNotification>(notificationsQuery);
  const unreadCount = storedNotifications?.filter(n => !n.read).length || 0;

  const markAllAsRead = async () => {
    if (!firestore || !user || !storedNotifications || unreadCount === 0) return;

    const batch = writeBatch(firestore);
    storedNotifications.forEach(notif => {
      if (!notif.read) {
        const notifRef = doc(firestore, `users/${user.uid}/notifications`, notif.id);
        batch.update(notifRef, { read: true });
      }
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };
  
  const handleClearHistory = async () => {
    if (!firestore || !user || !storedNotifications) return;

    const batch = writeBatch(firestore);
    storedNotifications.forEach(notif => {
        const notifRef = doc(firestore, `users/${user.uid}/notifications`, notif.id);
        batch.delete(notifRef);
    });
     try {
      await batch.commit();
    } catch (error) {
      console.error("Error clearing notification history:", error);
    }
  }


  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const allNotifications = [
    ...(messages.map(msg => ({
        id: msg.messageId || new Date().toISOString(),
        title: msg.notification?.title || 'Notification',
        body: msg.notification?.body || '',
        timestamp: msg.sentTime ? new Date(Number(msg.sentTime)) : new Date(),
        isNew: true
    }))),
    ...(storedNotifications?.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        timestamp: n.timestamp?.toDate() || new Date(),
        isNew: !n.read
    })) || [])
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());


  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="py-4">
            {allNotifications.length > 0 ? (
              <div className="space-y-3">
                {allNotifications.map((notif) => (
                  <div key={notif.id} className="p-3 rounded-md bg-secondary relative">
                    {notif.isNew && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"></div>}
                    <p className="font-semibold text-sm">{notif.title}</p>
                    <p className="text-xs text-secondary-foreground">{notif.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                       {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No new notifications.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
          <Button variant="outline" onClick={handleClearHistory} disabled={!allNotifications || allNotifications.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
