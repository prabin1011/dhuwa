'use client';

import { useMemo, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Check, Cigarette, Plus, Replace, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isFuture, isToday, parse, isAfter, subDays, isSameDay } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";
import type { Timestamp } from "firebase/firestore";


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
interface Urge {
    timestamp: Timestamp;
}

interface SmokingPlanProps {
    userProfile: WithId<UserProfile>;
    urges: WithId<Urge>[];
    selectedDate: Date;
}

export function SmokingPlan({ userProfile, urges, selectedDate }: SmokingPlanProps) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());

    const [newMomentTime, setNewMomentTime] = useState('');
    const [newMomentLabel, setNewMomentLabel] = useState('');
    const [replacementInput, setReplacementInput] = useState<{ momentId: string; value: string } | null>(null);

    const isDateInFuture = isFuture(selectedDate) && !isToday(selectedDate);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const { sortedMoments, nextMoment, dynamicDescription } = useMemo(() => {
        const moments = userProfile.moments || [];
        if (!moments) return { sortedMoments: [], nextMoment: null, dynamicDescription: "Plan your moments to get ahead of cravings." };

        const momentsWithDate = moments.map(m => ({
            ...m,
            date: parse(m.time, 'HH:mm', new Date()), // Use current date for parsing time
        }));

        const sorted = momentsWithDate.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        const next = isToday(selectedDate) 
            ? sorted.find(m => isAfter(m.date, currentTime) && m.completed?.[dateStr] === undefined) 
            : null;
        
        // Dynamic Description Logic
        let description = "Your next challenge is approaching. You have a plan. You can do this.";
        const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        const missedYesterday = moments.some(m => m.completed?.[yesterdayStr] === undefined && !isAfter(parse(m.time, 'HH:mm', new Date()), new Date()));
        const smokedToday = urges.some(u => u.timestamp && isToday(u.timestamp.toDate()));

        if (missedYesterday) {
            description = "You missed a moment yesterday. Today is a new chance to stay on track.";
        } else if (smokedToday && isToday(selectedDate)) {
            description = "One smoke logged. The chain is only as strong as the next link. You can break it here.";
        } else if (!next && isToday(selectedDate) && moments.length > 0) {
            description = "All planned moments for today are complete. Well done."
        }


        return { sortedMoments: sorted, nextMoment: next, dynamicDescription: description };
    }, [userProfile.moments, urges, currentTime, selectedDate, dateStr]);

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
                    <AccordionTrigger className="p-4">
                        <div className="flex flex-col items-start text-left w-full">
                             <CardTitle>{isToday(selectedDate) ? "Today's" : format(selectedDate, 'MMMM d')} Plan</CardTitle>
                             <CardDescription className="text-left mt-1">
                                {dynamicDescription}
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
                                            const isNext = nextMoment?.id === moment.id;

                                            return (
                                                <div key={moment.id} className={cn("p-3 rounded-md bg-secondary/30 text-left", isNext && "ring-2 ring-primary")}>
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
