'use client';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';

export function MyCommunityPosts() {
  const { firestore, user } = useFirebase();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(
      collection(firestore, 'community_posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
  }, [firestore, user]);

  if (!user || !posts.length) return null;

  return (
    <div className="rounded-xl border p-4 space-y-2 mt-4">
      <h3 className="font-semibold text-lg">My Community Posts</h3>
      {posts.map(p => (
        <div key={p.id} className="text-sm text-muted-foreground p-2 bg-secondary/30 rounded-md">
          Replaced <em>{p.habit}</em> with <em>{p.activity}</em> — ❤️ {p.likesCount || 0} · 💬 {p.commentsCount || 0}
        </div>
      ))}
    </div>
  );
}
