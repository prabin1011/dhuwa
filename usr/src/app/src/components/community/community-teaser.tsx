'use client';
import { collection, limit, onSnapshot, orderBy, query, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { addComment } from '@/lib/community';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';
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
  likeIds: string[];
  likesCount: number;
  commentsCount: number;
};

export function CommunityTeaser() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { locale } = useParams() as { locale: Locale };
  const [posts, setPosts] = useState<Post[]>([]);
  const [openCommentFor, setOpenCommentFor] = useState<string | null>(null);
  const [textByPost, setTextByPost] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!firestore || !user) return; // guard until authed
    const q = query(collection(firestore, 'community_posts'), orderBy('createdAt', 'desc'), limit(3));
    return onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
  }, [firestore, user]);

  const handleLike = async (post: Post) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Must be logged in to like posts.' });
      return;
    }
    const postRef = doc(firestore, 'community_posts', post.id);
    const hasLiked = post.likeIds?.includes(user.uid);
    try {
      await updateDoc(postRef, {
        likeIds: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likesCount: hasLiked ? (post.likesCount || 1) - 1 : (post.likesCount || 0) + 1,
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Like failed', description: e.message || 'Could not update like.' });
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !firestore) return;
    const text = (textByPost[postId] || '').trim();
    if (!text) return;

    try {
      await addComment(firestore, postId, {
        userId: user.uid,
        username: user.displayName || 'User',
        text
      });
      setTextByPost(prev => ({ ...prev, [postId]: '' }));
      setOpenCommentFor(null);
      toast({ title: 'Comment posted!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Comment failed', description: e.message || 'Could not post your comment.' });
    }
  };

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
        {posts.map(p => {
          const iLike = user ? p.likeIds?.includes(user.uid) : false;
          const isMyPost = user && p.userId === user.uid;
          return (
            <div key={p.id} className="rounded-lg border p-3 bg-background/50">
              <div className="text-sm">
                <strong>{p.username || 'Someone'}</strong> replaced <em>{p.habit}</em> with <em>{p.activity}</em>
                {p.momentLabel ? <> during <em>{p.momentLabel}</em></> : null}.
              </div>

              <div className="mt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); handleLike(p); }}
                  className={cn(iLike && "text-red-500")}
                >
                  <Heart className={cn("w-4 h-4", iLike && "fill-current")} />
                  <span className="ml-2">{p.likesCount || 0}</span>
                </Button>

                {!isMyPost && (
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setOpenCommentFor(openCommentFor === p.id ? null : p.id); }}
                    >
                    💬 {p.commentsCount || 0}
                    </Button>
                )}
              </div>

              {openCommentFor === p.id && !isMyPost && (
                <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Textarea
                    value={textByPost[p.id] || ''}
                    onChange={(e) => setTextByPost(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Add a quick cheer…"
                    className="h-9"
                  />
                  <Button size="sm" onClick={() => handleAddComment(p.id)} disabled={!((textByPost[p.id] || '').trim())}>
                    Send
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
