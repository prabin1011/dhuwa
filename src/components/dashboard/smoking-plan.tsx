'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X, Plus, Cigarette, Leaf } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SmokingPlanProps {
    habits: string[];
}

export function SmokingPlan({ habits }: SmokingPlanProps) {
    const { firestore, user } = useFirebase();
    const [newMomentLabel, setNewMomentLabel] = useState('');
    const [newMomentTime, setNewMomentTime] = useState('');

    const momentsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'moments'), orderBy('time'));
    }, [firestore, user]);

    const { data: moments, isLoading } = useCollection(momentsQuery);

    const handleAddMoment = () => {
        if (!user || !firestore) return;
        if (!newMomentLabel.trim() || !newMomentTime) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide both a time and a label.' });
            return;
        }

        const momentsCollection = collection(firestore, 'users', user.uid, 'moments');
        addDocumentNonBlocking(momentsCollection, {
            time: newMomentTime,
            label: newMomentLabel,
            createdAt: serverTimestamp(),
        });

        setNewMomentLabel('');
        setNewMomentTime('');
        toast({ title: 'Moment Added!', description: `Added "${newMomentLabel}" to your daily plan.` });
    };

    const handleDeleteMoment = (momentId: string) => {
        if (!user || !firestore) return;
        const momentRef = useMemoFirebase(() => doc(firestore, 'users', user.uid, 'moments', momentId), [firestore, user, momentId]);
        if (!momentRef) return;
        deleteDocumentNonBlocking(momentRef);
        toast({ title: 'Moment Removed', description: 'The moment has been removed from your plan.' });
    }

    const handleLogPlannedSmoke = (label: string) => {
         if (!user || !firestore) return;

        const urgesCollection = collection(firestore, 'users', user.uid, 'urges');
        addDocumentNonBlocking(urgesCollection, {
            timestamp: serverTimestamp(),
            type: habits[0] || 'Cigarette',
            notes: `Planned: ${label}`
        });

        toast({
            title: "Logged!",
            description: `Your planned smoke "${label}" was logged.`,
        });
    }

    // Helper to format 12-hour time
    const formatTime = (time: string) => {
        const [hour, minute] = time.split(':');
        const hourNum = parseInt(hour, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${formattedHour}:${minute} ${ampm}`;
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Smoking Moments</CardTitle>
                <CardDescription>Plan and track your routine smokes for the day.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                         <Input
                            type="time"
                            value={newMomentTime}
                            onChange={(e) => setNewMomentTime(e.target.value)}
                            className="w-28"
                        />
                        <Input
                            placeholder="e.g., Morning coffee"
                            value={newMomentLabel}
                            onChange={(e) => setNewMomentLabel(e.target.value)}
                        />
                        <Button size="icon" onClick={handleAddMoment}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {isLoading && <p>Loading plan...</p>}
                        {moments && moments.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No smoking moments planned yet. Add one to get started.</p>
                        )}
                        {moments?.map(moment => (
                            <div key={moment.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                                <div className="flex items-center gap-3">
                                   <Button size="sm" variant="outline" onClick={() => handleLogPlannedSmoke(moment.label)}>Log</Button>
                                   <div>
                                        <p className="font-medium text-sm">{moment.label}</p>
                                        <p className="text-xs text-muted-foreground">{formatTime(moment.time)}</p>
                                   </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteMoment(moment.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Need to import `doc` to be able to delete
import { doc } from 'firebase/firestore';
