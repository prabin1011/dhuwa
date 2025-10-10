
'use client';

import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useFirebase } from "@/firebase";
import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Check, Cigarette, Info, Plus, Replace, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, parse } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { User } from "firebase/auth";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { MoodAfterDialogAction } from "./mood-after-toast-action";
import { getNarrative } from "@/lib/narrative-vault";

const PREMADE_REPLACEMENTS = [
    "Drink a glass of water",
    "Do 10 push-ups",
    "Walk around the block",
    "Read a page of a book",
    "Listen to one song",
    "5 mins deep breathing"
];

const MOOD_OPTIONS = [
    {value: 'stressed', label: 'Stressed'},
    {value: 'bored', label: 'Bored'},
    {value: 'lonely', label: 'Lonely'},
    {value: 'happy', label: 'Happy'},
    {value: 'tired', label: 'Tired'},
    {value: 'anxious', label: 'Anxious'},
    {value: 'neutral', label: 'Neutral'},
]

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, string>;
    type?: string;
}

interface UserProfile {
    moments?: SmokingMoment[];
    breakDuration?: string;
}

interface SmokingPlanProps {
    user: User;
    userProfile: WithId<UserProfile>;
    selectedDate: Date;
}

export function SmokingPlan({ user, userProfile, selectedDate }: SmokingPlanProps) {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [newMomentTime, setNewMomentTime] = useState('');
    const [newMomentLabel, setNewMomentLabel] = useState('');
    const [customReplacement, setCustomReplacement] = useState("");
    const [selectedReplacement, setSelectedReplacement] = useState("");
    const [activeDialog, setActiveDialog] = useState<string | null>(null);

    const [moodMoment, setMoodMoment] = useState<SmokingMoment | null>(null);
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [isAfterMoodDialogOpen, setIsAfterMoodDialogOpen] = useState(false);
    const [lastUrgeId, setLastUrgeId] = useState<string | null>(null);


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

    const handleMarkMoment = async () => {
        if (!moodMoment || !selectedMood || !user || !firestore) return;

        const urgesCollection = collection(firestore, 'users', user.uid, 'urges');
        const momentToUpdate = moodMoment;
        
        // Close the mood dialog
        setMoodMoment(null);

        try {
            const { long, short } = getNarrative(selectedMood);

            // 1. Log the new urge to the 'urges' collection
            const urgeData = {
                timestamp: serverTimestamp(),
                type: momentToUpdate.type || 'Cigarettes',
                moodBefore: selectedMood,
                notes: `Planned: ${momentToUpdate.label} at ${momentToUpdate.time}`,
                narrative: long,
                shortMessage: short,
                count: 1, // Assume 1 for planned moments
            };
            const docRef = await addDoc(urgesCollection, urgeData);
            
            // 2. Update the moment in the user's profile to mark it as completed
            const updatedMoments = userProfile.moments?.map(m => {
                if (m.id === momentToUpdate.id) {
                    return { ...m, completed: { ...(m.completed || {}), [dateStr]: true } };
                }
                return m;
            });
            await updateMoments(updatedMoments || []);

            // 3. Trigger the 'after mood' dialog
            setLastUrgeId(docRef.id);
            setIsAfterMoodDialogOpen(true);

        } catch(e) {
            console.error("Error logging planned smoke:", e);
            toast({
                variant: "destructive",
                title: "Logging failed",
                description: "Could not save your smoke log. Please try again."
            })
        } finally {
            // Reset state
            setSelectedMood(null);
        }
    };
    
    const handleSaveReplacement = async (momentId: string) => {
        if (!user || !firestore) return;

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
            setCustomReplacement("");
            setSelectedReplacement("");
            setActiveDialog(null); // Close the dialog
        } catch (e) {
            // Error handled in updateMoments
        }
    };

    const resetForms = () => {
        setSelectedMood(null);
        setMoodMoment(null);
        setIsAfterMoodDialogOpen(false);
        setLastUrgeId(null);
    }

    return (
        <Card>
            <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline [&[data-state=open]]:pb-0">
                            <div className="flex justify-between items-start w-full gap-2">
                            <div className="flex-1">
                                <CardTitle>{isToday(selectedDate) ? "Today's" : format(selectedDate, 'MMMM d')} Plan</CardTitle>
                                <CardDescription className="text-left mt-1">
                                    Your scheduled moments for the day.
                                </CardDescription>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xs">
                                    <DialogHeader>
                                        <DialogTitle>About the Daily Plan</DialogTitle>
                                        <DialogDescription>
                                            Create a plan for your day. For each moment, you can log that you smoked or that you chose a positive replacement activity.
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                            </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 pt-2">
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
                                                            {status === false && <Replace className="w-4 h-4 text-blue-500" />}
                                                            
                                                            {!isProcessed && isToday(selectedDate) && (
                                                                <>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 text-destructive" onClick={() => setMoodMoment(moment)}>
                                                                        <Cigarette className="w-4 h-4" />
                                                                    </Button>
                                                                    
                                                                    <Dialog open={activeDialog === moment.id} onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}>
                                                                        <DialogTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 text-primary" onClick={() => setActiveDialog(moment.id)}>
                                                                                <Replace className="w-4 h-4" />
                                                                            </Button>
                                                                        </DialogTrigger>
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
                                                                                            className="h-auto min-h-10 py-2 whitespace-normal"
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
                                                                                <Button 
                                                                                    onClick={() => handleSaveReplacement(moment.id)} 
                                                                                    disabled={!selectedReplacement && !customReplacement}>
                                                                                    Save Replacement
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
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
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            {/* Mood Dialog for logging a smoked planned moment */}
            <Dialog open={!!moodMoment} onOpenChange={(isOpen) => !isOpen && setMoodMoment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>How are you feeling?</DialogTitle>
                        <DialogDescription>
                            Select the primary emotion you feel right now. This helps you identify triggers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <RadioGroup value={selectedMood ?? ''} onValueChange={setSelectedMood} className="grid grid-cols-2 gap-3">
                            {MOOD_OPTIONS.map(item => (
                                <Label key={item.value} htmlFor={`mood-${item.value}`} className="flex items-center space-x-3 rounded-md border-2 border-secondary bg-secondary/50 p-3 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:bg-primary/10">
                                    <RadioGroupItem value={item.value} id={`mood-${item.value}`} />
                                    <p className="font-medium text-sm">{item.label}</p>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMoodMoment(null)}>Cancel</Button>
                        <Button onClick={handleMarkMoment} disabled={!selectedMood}>
                            Log Smoke
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {/* This is the second, mandatory dialog for "mood after" */}
            <Dialog open={isAfterMoodDialogOpen} onOpenChange={setIsAfterMoodDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Moment Recorded</DialogTitle>
                        <DialogDescription>
                        Your moment of awareness has been logged. One last thing...
                        </DialogDescription>
                    </DialogHeader>
                    {lastUrgeId && <MoodAfterDialogAction urgeId={lastUrgeId} onMoodSelect={resetForms} />}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
