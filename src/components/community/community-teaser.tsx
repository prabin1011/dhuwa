
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
  const [openCommentFor, setOpenCommentFor] = useState<string|null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'community_posts'), orderBy('createdAt', 'desc'), limit(3));
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [firestore, user]);
  
  const handleLike = async (post: Post) => {
    if (!user || !firestore) {
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
  
  const handleAddComment = async (postId: string) => {
      if (!user || !firestore || !text.trim()) return;
      try {
          await addComment(firestore, postId, {
              userId: user.uid,
              username: user.displayName || 'User',
              text: text.trim()
          });
          setText('');
          setOpenCommentFor(null);
          toast({ title: 'Comment posted!' });
      } catch (error) {
          console.error("Error posting comment:", error);
          toast({ variant: 'destructive', title: 'Comment failed', description: 'Could not post your comment.' });
      }
  };


  if (!posts.length) return null;

  return (
    <Link href={`/${locale}/community`} className="block">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-3 hover:bg-secondary/30 transition-colors">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold">Community wins</h3>
            <span className="text-xs text-muted-foreground">Latest replacements</span>
        </div>

        <div className="space-y-3">
            {posts.map(p => {
            const iLike = user ? p.likeIds?.includes(user.uid) : false;
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
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(p); }}
                        className={cn(iLike && "text-red-500", "z-10")}
                    >
                    <Heart className={cn("w-4 h-4", iLike && "fill-current")} /> <span className="ml-2">{p.likesCount || 0}</span>
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenCommentFor(openCommentFor === p.id ? null : p.id); }}
                        className="z-10"
                    >
                    💬 {p.commentsCount || 0}
                    </Button>
                </div>

                {openCommentFor === p.id && (
                    <div 
                        className="mt-2 flex gap-2"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Add a quick cheer…"
                        className="h-9 z-10"
                    />
                    <Button
                        size="sm"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddComment(p.id); }}
                        disabled={!text.trim()}
                        className="z-10"
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
    </Link>
  );
}
