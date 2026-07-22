'use client';

import { useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';
import { togglePostLike } from "@/lib/community";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { timestampToDate } from "@/lib/timestamp";

interface CommunityPost {
    id: string;
    userId: string;
    username: string;
    habit?: string;
    activity: string;
    momentLabel: string;
    createdAt: Timestamp;
    likesCount?: number;
    likeIds?: string[];
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
    </Card>
);

function PostCard({ post, currentUserId, firestore }: {
    post: CommunityPost;
    currentUserId: string;
    firestore: any;
}) {
    const isLiked = post.likeIds?.includes(currentUserId) ?? false;
    const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
    const [optimisticCount, setOptimisticCount] = useState(post.likesCount ?? 0);
    const [pending, setPending] = useState(false);

    const handleLike = useCallback(async () => {
        if (pending) return;
        setPending(true);
        // Optimistic update
        setOptimisticLiked(prev => !prev);
        setOptimisticCount(prev => optimisticLiked ? prev - 1 : prev + 1);
        try {
            await togglePostLike(firestore, post.id, currentUserId, optimisticLiked);
        } catch {
            // Revert on failure
            setOptimisticLiked(optimisticLiked);
            setOptimisticCount(post.likesCount ?? 0);
        } finally {
            setPending(false);
        }
    }, [pending, optimisticLiked, post.id, post.likesCount, currentUserId, firestore]);

    const isOwnPost = post.userId === currentUserId;

    return (
        <Card className="bg-card">
            <CardHeader className="flex-row gap-3 items-center pb-3">
                <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {post.username?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{post.username}</p>
                    <p className="text-xs text-muted-foreground">
                        {post.momentLabel ? `Replaced "${post.momentLabel}"` : 'Shared a win'} •{' '}
                        {timestampToDate(post.createdAt)
                            ? formatDistanceToNow(timestampToDate(post.createdAt)!, { addSuffix: true })
                            : 'recently'}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
                <p className="font-medium text-base">
                    I chose to:{' '}
                    <span className="font-semibold text-primary">{post.activity}</span>
                </p>
                <div className="flex items-center gap-3 pt-1">
                    <button
                        onClick={handleLike}
                        disabled={isOwnPost || pending}
                        className={cn(
                            'flex items-center gap-1.5 text-sm transition-colors',
                            isOwnPost
                                ? 'text-muted-foreground/40 cursor-default'
                                : optimisticLiked
                                    ? 'text-rose-500 hover:text-rose-400'
                                    : 'text-muted-foreground hover:text-rose-500'
                        )}
                        aria-label={optimisticLiked ? 'Unlike' : 'Like'}
                    >
                        <Heart
                            className={cn('w-4 h-4 transition-all', optimisticLiked && 'fill-rose-500')}
                        />
                        <span className="font-medium tabular-nums">{optimisticCount > 0 ? optimisticCount : ''}</span>
                        {optimisticCount === 0 && <span className="text-xs">Be the first to cheer</span>}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function CommunityPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { locale } = useParams() as { locale: Locale };

    const postsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'community_posts'), orderBy('createdAt', 'desc'), limit(50));
    }, [firestore, user]);

    const { data: posts, isLoading } = useCollection<CommunityPost>(postsQuery);

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
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-md px-4 h-16 flex items-center gap-4">
                    <Link href={`/${locale}/dashboard`} className="p-2 rounded-full hover:bg-secondary">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Community Wins</h1>
                        <p className="text-sm text-muted-foreground">Real victories from real people.</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-md p-4 space-y-4 pb-16">
                {isLoading && Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}

                {!isLoading && posts?.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user.uid}
                        firestore={firestore}
                    />
                ))}

                {!isLoading && posts?.length === 0 && (
                    <div className="text-center py-16 space-y-2">
                        <p className="text-4xl">🌱</p>
                        <h3 className="text-lg font-semibold">The movement is just beginning.</h3>
                        <p className="text-muted-foreground text-sm">Log your first replacement activity to be the first one here!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
