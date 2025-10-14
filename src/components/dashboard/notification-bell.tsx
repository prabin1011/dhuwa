'use client';

import { useState, useMemo, useEffect } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, query, orderBy, limit } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface StoredNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Timestamp;
  read: boolean;
  link?: string;
}

const SYNC_COOLDOWN_HOURS = 4;
const LAST_SYNC_KEY = 'lastNotificationSyncTime';

export function NotificationBell() {
  const { firestore, user } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const savedTime = localStorage.getItem(LAST_SYNC_KEY);
    if (savedTime) {
        setLastSync(new Date(parseInt(savedTime, 10)));
    }
  }, []);

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `users/${user.uid}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(20)
    );
  }, [firestore, user]);

  const { data: storedNotifications } = useCollection<StoredNotification>(notificationsQuery);
  
  const unreadCount = useMemo(() => {
      return storedNotifications?.filter(n => !n.read).length || 0
  }, [storedNotifications]);

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
    if (!firestore || !user || !storedNotifications || storedNotifications.length === 0) return;

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

  const handleSyncNotifications = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in' });
      return;
    }

    if (lastSync && differenceInHours(new Date(), lastSync) < SYNC_COOLDOWN_HOURS) {
        toast({
            title: 'Insights up to date',
            description: `You can check for new insights again in about ${SYNC_COOLDOWN_HOURS - differenceInHours(new Date(), lastSync)} hour(s).`,
        });
        return;
    }
    
    try {
      const res = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check for notifications');
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem(LAST_SYNC_KEY, String(now.getTime()));
      
      toast({ title: 'Notification check complete.' });

    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Sync Failed', description: err.message });
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
        handleSyncNotifications(); // Trigger check when opening
        if (unreadCount > 0) {
            markAllAsRead();
        }
    }
  };
  
  const allNotifications = useMemo(() => {
      return (storedNotifications || []).map(n => ({...n, timestamp: n.timestamp?.toDate() || new Date()}))
  }, [storedNotifications]);


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
                    {!notif.read && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
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
        {allNotifications.length > 0 && (
            <SheetFooter>
                <Button variant="outline" onClick={handleClearHistory} disabled={!allNotifications || allNotifications.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear History
                </Button>
            </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
