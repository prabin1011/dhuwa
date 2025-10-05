'use client';

import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
}

interface UserProfile {
    moments?: SmokingMoment[];
}

interface SmokingPlanProps {
    userProfile: WithId<UserProfile>;
}

export function SmokingPlan({ userProfile }: SmokingPlanProps) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const [newMomentTime, setNewMomentTime] = useState('');
    const [newMomentLabel, setNewMomentLabel] = useState('');

    const sortedMoments = useMemo(() => {
        if (!userProfile.moments) return [];
        return [...userProfile.moments].sort((a, b) => a.time.localeCompare(b.time));
    }, [userProfile.moments]);

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

        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        const newMoment: SmokingMoment = {
            id: crypto.randomUUID(),
            time: newMomentTime,
            label: newMomentLabel,
        };

        try {
            await updateDoc(profileRef, {
                moments: arrayUnion(newMoment)
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

    const handleDeleteMoment = async (momentToDelete: SmokingMoment) => {
        if (!user || !firestore) return;
        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        try {
            await updateDoc(profileRef, {
                moments: arrayRemove(momentToDelete)
            });
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
                        {sortedMoments.length > 0 ? (
                            sortedMoments.map((moment) => (
                                <div key={moment.id} className="flex items-center justify-between bg-secondary/30 p-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-mono text-sm">{moment.time}</span>
                                        <span className="text-sm text-muted-foreground">-</span>
                                        <span className="text-sm">{moment.label}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMoment(moment)}>
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
