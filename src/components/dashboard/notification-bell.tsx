
'use client';

import { useState, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, query, orderBy, limit } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface StoredNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Timestamp;
  read: boolean;
  link?: string;
}

const COOLDOWN_HOURS = Number(process.env.NEXT_PUBLIC_INSIGHTS_COOLDOWN_HOURS ?? 4);


function msToHuman(ms: number) {
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.ceil(m / 60);
  return `${h} hour${h > 1 ? 's' : ''}`;
}

export function NotificationBell() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/notifications`),
      orderBy('timestamp', 'desc'),
      limit(50) // Increased limit for better history view
    );
  }, [firestore, user]);

  const { data: storedNotifications } = useCollection<StoredNotification>(notificationsQuery);

  const unreadCount = useMemo(() => {
    return storedNotifications?.filter(n => !n.read).length || 0;
  }, [storedNotifications]);

  const lastCheckKey = useMemo(() => (user ? `insights:lastCheck:${user.uid}` : null), [user?.uid]);
  const nextAllowedKey = useMemo(() => (user ? `insights:nextAllowedAt:${user.uid}` : null), [user?.uid]);


  const canCallNow = () => {
    if (!lastCheckKey) return false;
    
    // If server gave us a precise gate, use it
    const nextAllowed = nextAllowedKey ? localStorage.getItem(nextAllowedKey) : null;
    if (nextAllowed && Date.now() < new Date(nextAllowed).getTime()) return false;

    const last = localStorage.getItem(lastCheckKey);
    if (!last) return true;
    const elapsed = Date.now() - Number(last);
    return elapsed >= COOLDOWN_HOURS * 3600 * 1000;
  };

  const remainingCooldown = () => {
    const nextAllowed = nextAllowedKey ? localStorage.getItem(nextAllowedKey) : null;
    if (nextAllowed) return Math.max(0, new Date(nextAllowed).getTime() - Date.now());

    const last = lastCheckKey ? localStorage.getItem(lastCheckKey) : null;
    if (!last) return 0;
    return Math.max(0, COOLDOWN_HOURS * 3600 * 1000 - (Date.now() - Number(last)));
  };


  const handleSyncNotifications = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast({ title: 'Offline', description: 'Reconnect to refresh insights.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Please sign in' });
      return;
    }
    if (loading) return;

    if (!canCallNow()) {
      toast({
        title: 'Insights are up to date',
        description: `You can refresh again in ${msToHuman(remainingCooldown())}.`,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();

      if (res.ok && lastCheckKey) {
        localStorage.setItem(lastCheckKey, String(Date.now()));
        if (nextAllowedKey) {
          if (data?.nextAllowedAt) {
            localStorage.setItem(nextAllowedKey, data.nextAllowedAt);
          } else {
            localStorage.removeItem(nextAllowedKey);
          }
        }
      }

      if (!res.ok) throw new Error(data?.error || 'Failed to refresh insights');

      if (data?.skipped) {
        toast({
          title: 'Insights are up to date',
          description: data?.retryAfterSeconds
            ? `You can refresh again in ~${Math.ceil(data.retryAfterSeconds / 60)} min.`
            : `Try again later.`,
        });
        return;
      }

      if (!data.skipped) {
        toast({
          title: 'Inbox refreshed',
          description: data?.created > 0 ? `Added ${data.created} new insight(s).` : 'No new insights found.',
        });
      }

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Refresh failed', description: e.message });
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      handleSyncNotifications(); // Trigger sync on open
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
  };

  const allNotifications = useMemo(() => {
    return (storedNotifications || []).map(n => ({ ...n, timestamp: n.timestamp?.toDate() || new Date() }));
  }, [storedNotifications]);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full" disabled={loading}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Insights Inbox</SheetTitle>
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
                <p className="text-muted-foreground">No new insights yet.</p>
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
