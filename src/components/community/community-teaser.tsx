'use client';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';

type Post = {
  id: string;
  userId: string;
  username: string;
  habit: string;
  activity: string;
  momentLabel: string;
  createdAt?: any;
};

export function CommunityTeaser() {
  const { firestore, user } = useFirebase();
  const { locale } = useParams() as { locale: Locale };
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'community_posts'), orderBy('createdAt', 'desc'), limit(3));
    const unsub = onSnapshot(q, snap => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [firestore, user]);

  if (!posts.length) return null;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Community wins</h3>
        <Link href={`/${locale}/community`} className="text-xs text-muted-foreground hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="rounded-lg border p-3 bg-background/50">
            <div className="text-sm">
              <strong>{p.username || 'Someone'}</strong> replaced <em>{p.habit}</em> with <em>{p.activity}</em>
              {p.momentLabel ? <> during <em>{p.momentLabel}</em></> : null}.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
