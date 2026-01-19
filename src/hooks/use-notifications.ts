
'use client';

import { useEffect, useCallback, useState } from 'react';
import { useToast } from './use-toast';

export function useNotifications() {
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // On mount, synchronize the state with the current browser permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        toast({ variant: 'destructive', title: 'Unsupported', description: 'This browser does not support notifications.' });
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission !== 'granted') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'To receive reminders, please enable notifications in your browser settings.' });
    } else {
      toast({ title: 'Notifications Enabled', description: 'You will now receive scheduled reminders on this device.' });
    }
    return permission;
  }, [toast]);

  return { requestPermission, permissionStatus };
}
