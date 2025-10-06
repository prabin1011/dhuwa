'use client';

import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Check, Cigarette, Plus, Replace, Sparkles, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isFuture, isToday } from "date-fns";
import { Label } from "../ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";


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
    const [replacementInput, setReplacementInput] = useState<{ momentId: string; value: string } | null>(null);

    const isDateInFuture = isFuture(selectedDate) && !isToday(selectedDate);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const sortedMoments = useMemo(() => {
        if (!userProfile.moments) return [];
        return [...userProfile.moments].sort((a, b) => a.time.localeCompare(b.time));
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
    
    const handleMomentStatusUpdate = async (momentId: string, smoked: boolean) => {
        const updatedMoments = userProfile.moments?.map(m => {
            if (m.id === momentId) {
                const newCompleted = { ...(m.completed || {}), [dateStr]: smoked };
                const newReplacement = { ...(m.replacementActivity || {}) };
                if (smoked) {
                    delete newReplacement[dateStr]; // Remove replacement if they smoked
                }
                return { ...m, completed: newCompleted, replacementActivity: newReplacement };
            }
            return m;
        }) || [];

        try {
            await updateMoments(updatedMoments);
            toast({
                title: smoked ? "Moment Logged" : "Status updated",
                description: smoked ? `You've logged a smoke for ${format(selectedDate, 'MMM d')}.` : "You've undone the smoke log.",
            });
            // Clear any open input fields for this moment
            if (replacementInput?.momentId === momentId) {
                setReplacementInput(null);
            }
        } catch (e) {
            // Error is already toasted
        }
    };


    const handleStartReplacement = (momentId: string) => {
        setReplacementInput({ momentId, value: '' });
    }
    
    const handleSaveReplacement = async (momentId: string) => {
        if (!replacementInput || replacementInput.momentId !== momentId || !replacementInput.value) {
            toast({ variant: 'destructive', title: "Input required", description: "Please describe your replacement activity."});
            return;
        }

        const updatedMoments = userProfile.moments?.map(m => {
            if (m.id === momentId) {
                 const newCompleted = { ...(m.completed || {}), [dateStr]: false };
                 const newReplacement = { ...(m.replacementActivity || {}), [dateStr]: replacementInput.value };
                 return { ...m, completed: newCompleted, replacementActivity: newReplacement };
            }
            return m;
        }) || [];
        
        try {
             await updateMoments(updatedMoments);
             toast({ title: "Replacement Logged!", description: `Awesome choice for ${format(selectedDate, 'MMM d')}!` });
             setReplacementInput(null); // Close input on success
        } catch (e) {
            // Error handled in updateMoments
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

    return (
         <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
                <Card>
                    <AccordionTrigger className="p-6">
                        <div className="flex flex-col items-start text-left">
                             <CardTitle>{isToday(selectedDate) ? "Today's" : format(selectedDate, 'MMMM d')} Plan</CardTitle>
                             <CardDescription>Log smokes or replacements for your planned moments.</CardDescription>
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
                                                            {!isDateInFuture && !isProcessed ? (
                                                                <>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-400/10 hover:text-red-400" onClick={() => handleMomentStatusUpdate(moment.id, true)}>
                                                                        <Cigarette className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:bg-green-400/10 hover:text-green-400" onClick={() => handleStartReplacement(moment.id)}>
                                                                        <Replace className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            ) : !isDateInFuture && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMomentStatusUpdate(moment.id, !status)}>
                                                                    {status === true 
                                                                        ? <Cigarette className="w-4 h-4 text-red-400"/> 
                                                                        : <Check className="w-4 h-4 text-green-400" />}
                                                                </Button>
                                                            )}
                                                            {isToday(selectedDate) && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleDeleteMoment(moment.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {replacementInput?.momentId === moment.id && (
                                                         <div className="mt-2 space-y-2">
                                                            <Input 
                                                                placeholder="What did you do instead?" 
                                                                value={replacementInput.value} 
                                                                onChange={(e) => setReplacementInput({ ...replacementInput, value: e.target.value })}
                                                            />
                                                             <div className="flex gap-2">
                                                                <Button size="sm" onClick={() => handleSaveReplacement(moment.id)}>Save Replacement</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setReplacementInput(null)}>Cancel</Button>
                                                            </div>
                                                         </div>
                                                    )}
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
                </Card>
            </AccordionItem>
        </Accordion>
    );
}

    
