
'use client';

import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";

interface SmokingMoment {
    time: string;
    label: string;
}

export function SmokingPlan() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const [newMomentTime, setNewMomentTime] = useState('');
    const [newMomentLabel, setNewMomentLabel] = useState('');

    const momentsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        const momentsCollection = collection(firestore, 'users', user.uid, 'moments');
        return query(momentsCollection, orderBy('time'));
    }, [firestore, user]);

    const { data: moments, isLoading } = useCollection<SmokingMoment>(momentsQuery);

    const handleAddMoment = async () => {
        if (!newMomentTime || !newMomentLabel) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please set both a time and a label.",
            });
            return;
        }
        if (!user || !firestore) return;

        const momentsCollection = collection(firestore, 'users', user.uid, 'moments');
        
        try {
            await addDocumentNonBlocking(momentsCollection, {
                time: newMomentTime,
                label: newMomentLabel,
                createdAt: serverTimestamp(),
            });
            toast({
                title: "Moment Added!",
                description: `Added "${newMomentLabel}" to your daily plan.`,
            });
            setNewMomentTime('');
            setNewMomentLabel('');
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: "Could not add moment",
                description: e?.message ?? "An unexpected error occurred.",
            });
        }
    };

    const handleDeleteMoment = async (momentId: string) => {
        if (!user || !firestore) return;
        const momentRef = collection(firestore, 'users', user.uid, 'moments');
        const docRef = doc(momentRef, momentId);
        try {
            await deleteDocumentNonBlocking(docRef);
            toast({
                title: "Moment Removed",
                description: "The moment has been removed from your plan.",
            });
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: "Could not remove moment",
                description: e?.message ?? "An unexpected error occurred.",
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Smoking Moments</CardTitle>
                <CardDescription>Plan your daily smokes to stay mindful.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </>
                        ) : moments && moments.length > 0 ? (
                            moments.map((moment: WithId<SmokingMoment>) => (
                                <div key={moment.id} className="flex items-center justify-between bg-secondary/30 p-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-mono text-sm">{moment.time}</span>
                                        <span className="text-sm text-muted-foreground">-</span>
                                        <span className="text-sm">{moment.label}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMoment(moment.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No moments planned yet.</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t">
                        <Input
                            type="time"
                            value={newMomentTime}
                            onChange={(e) => setNewMomentTime(e.target.value)}
                            className="w-28"
                            aria-label="Time"
                        />
                        <Input
                            type="text"
                            placeholder="e.g., Morning coffee"
                            value={newMomentLabel}
                            onChange={(e) => setNewMomentLabel(e.target.value)}
                            className="flex-1"
                            aria-label="Label"
                        />
                        <Button onClick={handleAddMoment} size="icon" aria-label="Add moment">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
