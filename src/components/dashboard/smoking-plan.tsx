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
import { format, isToday, parse, isAfter } from "date-fns";
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

    const isDateInFuture = isAfter(selectedDate, new Date()) && !isToday(selectedDate);
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

    return (
         <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
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
                                                            {isToday(selectedDate) && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleDeleteMoment(moment.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
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
                </Card>
            </AccordionItem>
        </Accordion>
    );
}
