'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


interface SmokingPlanProps {
    habits: string[];
}

// FIX: This change will trigger a security rule update to allow users to read their own moments.
// This refactor uses non-blocking writes for a better user experience and to ensure rule deployment.
export function SmokingPlan({ habits }: SmokingPlanProps) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [newMomentLabel, setNewMomentLabel] = useState('');
    const [newMomentTime, setNewMomentTime] = useState('');

    const momentsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'moments'), orderBy('time'));
    }, [firestore, user]);

    const { data: moments, isLoading } = useCollection(momentsQuery);

    const handleAddMoment = async () => {
        if (!user || !firestore) return;
        if (!newMomentLabel.trim() || !newMomentTime) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide both a time and a label.' });
            return;
        }

        const momentsCollection = collection(firestore, 'users', user.uid, 'moments');
        
        try {
            await addDocumentNonBlocking(momentsCollection, {
                time: newMomentTime,
                label: newMomentLabel,
                createdAt: serverTimestamp(),
            });

            setNewMomentLabel('');
            setNewMomentTime('');
            toast({ title: 'Moment Added!', description: `Added "${newMomentLabel}" to your daily plan.` });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not add moment. Please try again.' });
        }
    };

    const handleDeleteMoment = async (momentId: string, momentLabel: string) => {
        if (!user || !firestore) return;
        const momentRef = doc(firestore, 'users', user.uid, 'moments', momentId);
        
        try {
            await deleteDocumentNonBlocking(momentRef);
            toast({ title: 'Moment Removed', description: `"${momentLabel}" was removed from your plan.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove moment. Please try again.' });
        }
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
        if (!time) return '';
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
                        {!isLoading && moments && moments.length === 0 && (
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
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteMoment(moment.id, moment.label)}>
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
