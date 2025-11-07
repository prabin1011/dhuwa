'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit, type Firestore } from 'firebase/firestore';

export type Comment = {
  id: string;
  userId: string;
  username: string;
  text: string;
  parentId: string | null;
  createdAt?: any;
};

export function useComments(firestore: Firestore, postId: string, myUid?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  
  useEffect(() => {
    if (!firestore || !postId) return;
    const q = query(
      collection(firestore, 'community_posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(10) // show last 10; adjust as you like
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return unsub;
  }, [firestore, postId]);

  return { comments };
}
