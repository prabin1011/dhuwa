'use client';

import { useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';
import { cn } from "@/lib/utils";
import { useState } from "react";
import { addComment } from "@/lib/community";
import { useToast } from "@/hooks/use-toast";
import { useComments } from '@/hooks/useComments';


interface CommunityPost {
    id: string;
    userId: string;
    username: string;
    activity: string;
    momentLabel: string;
    createdAt: Timestamp;
    likesCount: number;
    commentsCount: number;
    likeIds: string[];
}

const PostSkeleton = () => (
    <Card>
        <CardHeader className="flex-row gap-4 items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
            </div>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-5 w-3/4" />
        </CardContent>
        <CardFooter className="gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
        </CardFooter>
    </Card>
);


export default function CommunityPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();
    const { locale } = useParams() as { locale: Locale };
    const [textByPost, setTextByPost] = useState<Record<string, string>>({});

    const postsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'community_posts'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore, user]);

    const { data: posts, isLoading } = useCollection<CommunityPost>(postsQuery);

    const handleLike = async (post: CommunityPost) => {
        if (!user || !firestore) return;
        const postRef = doc(firestore, 'community_posts', post.id);

        const hasLiked = post.likeIds?.includes(user.uid);
        
        try {
            await updateDoc(postRef, {
                likeIds: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
                likesCount: hasLiked ? (post.likesCount || 1) - 1 : (post.likesCount || 0) + 1,
            });
        } catch (error) {
            console.error("Error liking post:", error);
            toast({ variant: 'destructive', title: 'Like failed', description: 'Could not update like.' });
        }
    };

    const handleAddComment = async (postId: string) => {
        if (!user || !firestore) return;
        
        console.log('Attempting to comment. My UID:', user.uid, 'Post ID:', postId);

        const text = (textByPost[postId] || '').trim();
        if (!text) return;
        
        try {
            await addComment(firestore, postId, {
              userId: user.uid,
              username: user.displayName || 'User',
              text
            });
            setTextByPost(prev => ({ ...prev, [postId]: '' }));
            toast({ title: 'Comment posted!' });
        } catch(e: any) {
             toast({ variant: 'destructive', title: 'Comment failed', description: e.message || 'Could not post your comment.' });
        }
    };
    
    if (!user) {
        return (
             <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-center p-4">
                    <h1 className="text-xl font-bold">Community Wins</h1>
                    <p className="text-muted-foreground mt-2">You must be logged in to view the community feed.</p>
                    <Button asChild className="mt-4">
                        <Link href={`/${locale}/login`}>Log In</Link>
                    </Button>
                </div>
            </div>
        )
    }
    
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-md px-4 sm:px-6 md:px-8 h-16 flex items-center gap-4">
                    <Link href={`/${locale}/dashboard`} className="p-2 rounded-full hover:bg-secondary">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold">Community Wins</h1>
                        <p className="text-sm text-muted-foreground">A live feed of victories from the community.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-md p-4 space-y-4">
                 {isLoading && Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
                
                 {!isLoading && posts?.map(post => {
                    const hasLiked = user && post.likeIds?.includes(user.uid);
                    const isMyPost = user && post.userId === user.uid;
                    const { comments, hasCommented } = useComments(firestore, post.id, user?.uid);

                    return (
                        <Card key={post.id} className="bg-card">
                            <CardHeader className="flex-row gap-3 items-center pb-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{post.username?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold">{post.username}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Replaced "{post.momentLabel}" • {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4 space-y-3">
                                <p className="font-medium text-base">I chose to: <span className="font-semibold text-primary">{post.activity}</span></p>

                                {!!comments.length && (
                                    <div className="space-y-2 border-t pt-3">
                                      {comments.map(c => (
                                        <div key={c.id} className="text-sm rounded-md bg-muted/50 p-2">
                                          <span className="font-medium">{c.username || 'User'}</span>
                                          <span className="mx-1 text-muted-foreground">•</span>
                                          <span>{c.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                )}
                                
                                {!isMyPost && !hasCommented && (
                                    <div className="flex gap-2">
                                    <Textarea
                                        value={textByPost[post.id] || ''}
                                        onChange={(e) => setTextByPost(prev => ({ ...prev, [post.id]: e.target.value }))}
                                        placeholder="Add a quick cheer…"
                                        className="h-9"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleAddComment(post.id)}
                                        disabled={!((textByPost[post.id] || '').trim())}
                                    >
                                        Send
                                    </Button>
                                    </div>
                                 )}
                                 {!isMyPost && hasCommented && (
                                    <p className="text-xs text-muted-foreground pt-2">You’ve already commented on this win.</p>
                                 )}
                            </CardContent>
                            <CardFooter className="gap-2 border-t pt-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleLike(post)}
                                    className={cn("flex items-center gap-2", hasLiked && "text-red-500 hover:text-red-600")}
                                >
                                    <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
                                    <span>{post.likesCount || 0}</span>
                                </Button>
                                <span className="text-xs text-muted-foreground ml-2">💬 {post.commentsCount || 0}</span>
                            </CardFooter>
                        </Card>
                    );
                })}
                {!isLoading && posts?.length === 0 && (
                     <div className="text-center py-12">
                        <h3 className="text-lg font-semibold">The movement is just beginning.</h3>
                        <p className="text-muted-foreground mt-2">Log your first replacement activity to be the first one to post here!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
