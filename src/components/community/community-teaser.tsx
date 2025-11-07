'use client';
import { collection, limit, onSnapshot, orderBy, query, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { addComment } from '@/lib/community';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [openCommentFor, setOpenCommentFor] = useState<string|null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'community_posts'), orderBy('createdAt', 'desc'), limit(5));
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [firestore, user]);
  
  const handleLike = async (post: Post) => {
    if (!user) {
        toast({variant: 'destructive', title: 'Must be logged in to like posts.'});
        return;
    }
    const postRef = doc(firestore, 'community_posts', post.id);
    const hasLiked = post.likeIds?.includes(user.uid);

    try {
        await updateDoc(postRef, {
            likeIds: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
            likesCount: hasLiked ? (post.likesCount || 1) - 1 : (post.likesCount || 0) + 1,
        });
    } catch (error) {
        console.error("Error liking post:", error);
        toast({variant: 'destructive', title: 'Like failed', description: 'Could not update like.'});
    }
  };


  if (!posts.length) return null;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Community wins</h3>
        <span className="text-xs text-muted-foreground">Latest replacements</span>
      </div>

      <div className="space-y-3">
        {posts.map(p => {
          const iLike = user ? p.likeIds?.includes(user.uid) : false;
          return (
            <div key={p.id} className="rounded-lg border p-3">
              <div className="text-sm">
                <strong>{p.username || 'Someone'}</strong> replaced <em>{p.habit}</em> with <em>{p.activity}</em>
                {p.momentLabel ? <> during <em>{p.momentLabel}</em></> : null}.
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Button size="sm" variant={iLike ? 'secondary' : 'outline'} onClick={() => handleLike(p)}
                  className={cn(iLike && "text-red-500 hover:text-red-600")}
                >
                  <span className={cn(iLike && "fill-current")}>❤️</span> <span className="ml-2">{p.likesCount || 0}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpenCommentFor(openCommentFor === p.id ? null : p.id)}>
                  💬 {p.commentsCount || 0}
                </Button>
              </div>

              {openCommentFor === p.id && (
                <div className="mt-2 flex gap-2">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Add a quick cheer…"
                    className="h-9"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!user || !text.trim()) return;
                      await addComment(firestore, p.id, {
                        userId: user.uid,
                        username: user.displayName || 'User',
                        text: text.trim()
                      });
                      setText('');
                      setOpenCommentFor(null);
                    }}
                  >
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
