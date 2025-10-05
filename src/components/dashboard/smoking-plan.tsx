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
import { format } from "date-fns";
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
    replacementActivity?: Record<string, string>;
}

interface UserProfile {
    moments?: SmokingMoment[];
    breakDuration?: string;
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
    const [replacementInput, setReplacementInput] = useState<{ momentId: string; value: string } | null>(null);

    const todayStr = format(new Date(), 'yyyy-MM-dd');

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
                const newCompleted = { ...(m.completed || {}), [todayStr]: smoked };
                const newReplacement = { ...(m.replacementActivity || {}) };
                if (smoked) {
                    delete newReplacement[todayStr]; // Remove replacement if they smoked
                }
                return { ...m, completed: newCompleted, replacementActivity: newReplacement };
            }
            return m;
        }) || [];

        try {
            await updateMoments(updatedMoments);
            toast({
                title: smoked ? "Moment Logged" : "Status updated",
                description: smoked ? "You've logged a smoke." : "You've undone the smoke log.",
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
        // Optionally generate a suggestion when user decides to replace
        handleGenerateSuggestion(momentId);
    }
    
    const handleSaveReplacement = async (momentId: string) => {
        if (!replacementInput || replacementInput.momentId !== momentId || !replacementInput.value) {
            toast({ variant: 'destructive', title: "Input required", description: "Please describe your replacement activity."});
            return;
        }

        const updatedMoments = userProfile.moments?.map(m => {
            if (m.id === momentId) {
                 // Mark as skipped (false) and add the replacement text
                 const newCompleted = { ...(m.completed || {}), [todayStr]: false };
                 const newReplacement = { ...(m.replacementActivity || {}), [todayStr]: replacementInput.value };
                 return { ...m, completed: newCompleted, replacementActivity: newReplacement };
            }
            return m;
        }) || [];
        
        try {
             await updateMoments(updatedMoments);
             toast({ title: "Replacement Logged!", description: "Awesome choice!" });
             setReplacementInput(null); // Close input on success
             setSuggestion(null); // Clear suggestion
        } catch (e) {
            // Error handled in updateMoments
        }
    }


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
            setSuggestion(null); // Clear suggestion on error
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
        
        const newMoment: SmokingMoment = {
            id: crypto.randomUUID(),
            time: newMomentTime,
            label: newMomentLabel,
            completed: {}
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
                             <CardTitle>Today's Smoking Plan</CardTitle>
                             <CardDescription>Log whether you smoked, or replaced the habit.</CardDescription>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {sortedMoments.length > 0 ? (
                                        sortedMoments.map((moment) => {
                                            const status = moment.completed?.[todayStr]; // true, false, or undefined
                                            const replacementText = moment.replacementActivity?.[todayStr];
                                            const isProcessed = status !== undefined;

                                            return (
                                                <div key={moment.id} className="p-3 rounded-md bg-secondary/30 text-left">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                 <span className={`font-mono text-sm ${isProcessed ? 'line-through text-muted-foreground' : ''}`}>{moment.time}</span>
                                                                <span className={`text-sm font-medium ${isProcessed ? 'line-through text-muted-foreground' : ''}`}>{moment.label}</span>
                                                            </div>
                                                            {replacementText && (
                                                                <div className="mt-2 text-xs pl-1">Replaced with: <span className="font-semibold text-foreground">{replacementText}</span></div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {!isProcessed ? (
                                                                <>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-400/10 hover:text-red-400" onClick={() => handleMomentStatusUpdate(moment.id, true)}>
                                                                        <Cigarette className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:bg-green-400/10 hover:text-green-400" onClick={() => handleStartReplacement(moment.id)}>
                                                                        <Replace className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMomentStatusUpdate(moment.id, !status)}>
                                                                    {status === true 
                                                                        ? <Check className="w-4 h-4 text-green-400"/> 
                                                                        : <X className="w-4 h-4 text-red-400" />}
                                                                </Button>
                                                            )}
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleDeleteMoment(moment.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    {replacementInput?.momentId === moment.id && (
                                                         <div className="mt-2 space-y-2">
                                                            {suggestion?.momentId === moment.id && (
                                                                <div className="p-2 bg-primary/10 rounded-md text-sm">
                                                                    <p className="font-bold flex items-center gap-2 text-primary/80"><Sparkles className="w-4 h-4"/>Suggestion</p>
                                                                    <p className="mt-1 pl-1 text-primary/90">{isGenerating ? <span className="animate-pulse">Thinking...</span> : suggestion.text}</p>
                                                                </div>
                                                            )}
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

    