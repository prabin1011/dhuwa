'use client';

import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Check, Cigarette, Plus, Replace, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, parse, isAfter } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const PREMADE_REPLACEMENTS = [
    "Drink a glass of water",
    "Do 10 push-ups",
    "Walk around the block",
    "Read a page of a book",
    "Listen to one song",
    "5 minutes of deep breathing"
];


interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, string>;
}

interface UserProfile {
    moments?: SmokingMoment[];
    breakDuration?: string;
}

interface SmokingPlanProps {
    userProfile: WithId<UserProfile>;
    selectedDate: Date;
}

export function SmokingPlan({ userProfile, selectedDate }: SmokingPlanProps) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const [newMomentTime, setNewMomentTime] = useState('');
    const [newMomentLabel, setNewMomentLabel] = useState('');
    const [dialogState, setDialogState] = useState<{ isOpen: boolean, momentId: string | null }>({ isOpen: false, momentId: null });
    const [selectedReplacement, setSelectedReplacement] = useState("");
    const [customReplacement, setCustomReplacement] = useState("");


    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const sortedMoments = useMemo(() => {
        const moments = userProfile.moments || [];
        if (!moments) return [];

        return moments
            .map(m => ({
                ...m,
                date: parse(m.time, 'HH:mm', new Date()), // Use current date for parsing time
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        
    }, [userProfile.moments]);

    const updateMoments = async (updatedMoments: SmokingMoment[]) => {
        if (!user || !firestore) return;
        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        try {
            await updateDoc(profileRef, { moments: updatedMoments });
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: "Update failed",
                description: e?.message ?? "An unexpected error occurred.",
            });
            throw e; // re-throw to handle in calling function
        }
    }

    const handleAddMoment = async () => {
        if (!newMomentTime || !newMomentLabel) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please set both a time and a label.",
            });
            return;
        }
        
        const newMoment: SmokingMoment = {
            id: crypto.randomUUID(),
            time: newMomentTime,
            label: newMomentLabel,
            completed: {},
            replacementActivity: {}
        };
        
        const newMomentsArray = [...(userProfile.moments || []), newMoment];

        try {
            await updateMoments(newMomentsArray);
            toast({
                title: "Moment Added!",
                description: `Added "${newMomentLabel}" to your daily plan.`,
            });
            setNewMomentTime('');
            setNewMomentLabel('');
        } catch (e) {
             // Error is handled in updateMoments
        }
    };

    const handleDeleteMoment = async (momentId: string) => {
        const updatedMoments = userProfile.moments?.filter(m => m.id !== momentId);
        try {
            await updateMoments(updatedMoments || []);
            toast({
                title: "Moment Removed",
                description: "The moment has been removed from your plan.",
            });
        } catch (e) {
            // Error is handled in updateMoments
        }
    };

    const handleMarkMoment = async (momentId: string, completed: boolean) => {
        const updatedMoments = userProfile.moments?.map(m => {
            if (m.id === momentId) {
                return { ...m, completed: { ...(m.completed || {}), [dateStr]: completed } };
            }
            return m;
        });
        try {
            await updateMoments(updatedMoments || []);
            toast({ title: completed ? 'Moment Logged' : 'Moment Skipped' });
        } catch (e) { /* Error handled in updateMoments */ }
    };
    
    const handleSaveReplacement = async () => {
        const { momentId } = dialogState;
        if (!user || !firestore || !momentId) return;

        const replacementValue = customReplacement || selectedReplacement;
        if (!replacementValue) {
            toast({ variant: 'destructive', title: "Input required", description: "Please choose or enter a replacement activity." });
            return;
        }

        const updatedMoments = userProfile.moments?.map(m => {
            if (m.id === momentId) {
                return {
                    ...m,
                    completed: { ...(m.completed || {}), [dateStr]: false }, // Mark as skipped
                    replacementActivity: { ...(m.replacementActivity || {}), [dateStr]: replacementValue }
                };
            }
            return m;
        }) || [];
        
        try {
            await updateMoments(updatedMoments);
            toast({ title: "Replacement Logged!", description: `Great choice!` });
            setDialogState({ isOpen: false, momentId: null });
            setCustomReplacement("");
            setSelectedReplacement("");
        } catch (e) {
            // Error handled in updateMoments
        }
    };


    return (
         <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
                 <Dialog open={dialogState.isOpen} onOpenChange={(isOpen) => setDialogState({ isOpen, momentId: isOpen ? dialogState.momentId : null })}>
                    <Card>
                        <AccordionTrigger className="p-4">
                            <div className="flex flex-col items-start text-left w-full">
                                 <CardTitle>{isToday(selectedDate) ? "Today's" : format(selectedDate, 'MMMM d')} Plan</CardTitle>
                                 <CardDescription className="text-left mt-1">
                                    Your scheduled moments for the day.
                                 </CardDescription>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        {sortedMoments.length > 0 ? (
                                            sortedMoments.map((moment) => {
                                                const status = moment.completed?.[dateStr]; // true, false, or undefined
                                                const replacementText = moment.replacementActivity?.[dateStr];
                                                const isProcessed = status !== undefined;

                                                return (
                                                    <div key={moment.id} className="p-3 rounded-md bg-secondary/30 text-left">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                     <span className={cn('font-mono text-sm', isProcessed && 'line-through text-muted-foreground')}>{moment.time}</span>
                                                                    <span className={cn('text-sm font-medium', isProcessed && 'line-through text-muted-foreground')}>{moment.label}</span>
                                                                </div>
                                                                {replacementText && (
                                                                    <div className="mt-2 text-xs pl-1">Replaced with: <span className="font-semibold text-foreground">{replacementText}</span></div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {status === true && <Check className="w-4 h-4 text-green-500" />}
                                                                {status === false && !replacementText && <Replace className="w-4 h-4 text-blue-500" />}
                                                                
                                                                {!isProcessed && isToday(selectedDate) && (
                                                                    <>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 text-destructive" onClick={() => handleMarkMoment(moment.id, true)}>
                                                                            <Cigarette className="w-4 h-4" />
                                                                        </Button>
                                                                        <DialogTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 text-primary" onClick={() => setDialogState({ isOpen: true, momentId: moment.id })}>
                                                                                <Replace className="w-4 h-4" />
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                    </>
                                                                )}
                                                                
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleDeleteMoment(moment.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">No moments planned. Add one to get started!</p>
                                        )}
                                    </div>

                                    {isToday(selectedDate) && (
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
                                    )}
                                </div>
                            </CardContent>
                        </AccordionContent>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Choose Your Replacement</DialogTitle>
                                <DialogDescription>
                                    Pick from the list or add your own positive action.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {PREMADE_REPLACEMENTS.map(item => (
                                        <Button
                                            key={item}
                                            variant={selectedReplacement === item ? "default" : "outline"}
                                            onClick={() => { setSelectedReplacement(item); setCustomReplacement(""); }}
                                        >
                                            {item}
                                        </Button>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Or type your own replacement..."
                                    value={customReplacement}
                                    onChange={(e) => { setCustomReplacement(e.target.value); setSelectedReplacement(""); }}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveReplacement} disabled={!selectedReplacement && !customReplacement}>
                                    Save Replacement
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Card>
                </Dialog>
            </AccordionItem>
        </Accordion>
    );
}
