'use client';

import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Check, Clock, Plus, Sparkles, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday } from "date-fns";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { getReplacementSuggestion } from "@/ai/flows/replacement-suggestion-flow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
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
    const [suggestion, setSuggestion] = useState<{momentId: string, text: string} | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const sortedMoments = useMemo(() => {
        if (!userProfile.moments) return [];
        return [...userProfile.moments].sort((a, b) => a.time.localeCompare(b.time));
    }, [userProfile.moments]);

    const handleMomentCompletionToggle = async (moment: SmokingMoment, smoked: boolean) => {
        if (!user || !firestore) return;

        const updatedMoments = userProfile.moments?.map(m => {
            if (m.id === moment.id) {
                const newCompleted = { ...(m.completed || {}), [todayStr]: smoked };
                return { ...m, completed: newCompleted };
            }
            return m;
        });

        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        
        try {
            await updateDoc(profileRef, { moments: updatedMoments });
            
            if (smoked) {
                 toast({ title: "Moment Logged", description: `You've logged a smoke for "${moment.label}".` });
            } else {
                 toast({ title: "Great job!", description: `You've marked "${moment.label}" as skipped!` });
                 handleGenerateSuggestion(moment.id);
            }
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: "Update failed",
                description: e?.message ?? "An unexpected error occurred.",
            });
        }
    };
    
    const handleGenerateSuggestion = async (momentId: string) => {
        setIsGenerating(true);
        setSuggestion({momentId, text: ""});
        try {
            const result = await getReplacementSuggestion({
                habit: "smoking",
                breakDuration: userProfile.breakDuration || "5-10 minutes"
            });
            setSuggestion({ momentId, text: result });
        } catch (error) {
            console.error("Failed to get suggestion", error);
            setSuggestion({ momentId, text: "Try stretching or drinking a glass of water." });
        } finally {
            setIsGenerating(false);
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
        if (!user || !firestore) return;

        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        const newMoment: SmokingMoment = {
            id: crypto.randomUUID(),
            time: newMomentTime,
            label: newMomentLabel,
            completed: {}
        };
        
        const newMomentsArray = [...(userProfile.moments || []), newMoment];

        try {
            await updateDoc(profileRef, {
                moments: newMomentsArray
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
        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        const updatedMoments = userProfile.moments?.filter(m => m.id !== momentId);
        try {
            await updateDoc(profileRef, {
                moments: updatedMoments
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
         <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1">
                <Card>
                    <AccordionTrigger className="p-6">
                        <div className="flex flex-col items-start">
                             <CardTitle>Today's Smoking Plan</CardTitle>
                             <CardDescription>Check off moments you smoke. Leave them unchecked if you skip.</CardDescription>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {sortedMoments.length > 0 ? (
                                        sortedMoments.map((moment) => {
                                            const isCompletedToday = moment.completed?.[todayStr] === true;
                                            const isSkippedToday = moment.completed?.[todayStr] === false;
                                            
                                            return (
                                                <div key={moment.id}>
                                                    <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-md">
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                id={`moment-${moment.id}`}
                                                                checked={isCompletedToday}
                                                                onCheckedChange={(checked) => handleMomentCompletionToggle(moment, !!checked)}
                                                            />
                                                            <Label htmlFor={`moment-${moment.id}`} className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                     <span className={`font-mono text-sm ${isCompletedToday || isSkippedToday ? 'line-through text-muted-foreground' : ''}`}>{moment.time}</span>
                                                                    <span className={`text-sm ${isCompletedToday || isSkippedToday ? 'line-through text-muted-foreground' : ''}`}>{moment.label}</span>
                                                                </div>
                                                            </Label>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMoment(moment.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    {suggestion?.momentId === moment.id && (
                                                         <div className="mt-2 p-3 bg-primary/10 rounded-md text-sm">
                                                             <p className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/>Instead, you could...</p>
                                                             <p className="mt-1 pl-1">{isGenerating ? <span className="animate-pulse">Thinking of something...</span> : suggestion.text}</p>
                                                         </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No moments planned. Add one to get started!</p>
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
                    </AccordionContent>
                </Card>
            </AccordionItem>
        </Accordion>
    );
}
