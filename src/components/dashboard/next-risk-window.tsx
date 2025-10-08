
'use client';

import { useMemo, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { WithId } from "@/firebase";
import { Replace, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parse, isAfter, isToday, formatDistanceToNowStrict, subDays } from "date-fns";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

interface SmokingMoment {
    id: string;
    time: string;
    label: string;
    completed: Record<string, boolean>;
    replacementActivity?: Record<string, string>;
}

interface UserProfile {
    moments?: SmokingMoment[];
}

interface Urge {
    timestamp: { toDate: () => Date };
}

interface NextRiskWindowProps {
    userProfile: WithId<UserProfile>;
    urges: WithId<Urge>[];
}

const PREMADE_REPLACEMENTS = [
    "Drink a glass of water",
    "Do 10 push-ups",
    "Walk around the block",
    "Read a page of a book",
    "Listen to one song",
    "5 mins deep breathing"
];

export function NextRiskWindow({ userProfile, urges }: NextRiskWindowProps) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedReplacement, setSelectedReplacement] = useState("");
    const [customReplacement, setCustomReplacement] = useState("");

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 30); // Update every 30 seconds
        return () => clearInterval(timer);
    }, []);

    const { nextMoment, dynamicDescription, timeToNext } = useMemo(() => {
        const moments = userProfile.moments || [];
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        const momentsWithDate = moments.map(m => ({
            ...m,
            date: parse(m.time, 'HH:mm', new Date()),
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        const next = momentsWithDate.find(m => isAfter(m.date, currentTime) && m.completed?.[todayStr] === undefined);
        const timeToNext = next ? formatDistanceToNowStrict(next.date, { addSuffix: true }) : null;

        let description = `Your next planned smoke is ${timeToNext}. You have a plan. You can do this.`;
        const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        const missedYesterday = moments.some(m => m.completed?.[yesterdayStr] === undefined && !isAfter(parse(m.time, 'HH:mm', new Date()), new Date()));
        const smokedToday = urges.some(u => u.timestamp && isToday(u.timestamp.toDate()));

        if (!next) {
            description = "No upcoming risk windows today. Well done on completing your plan.";
        } else if (missedYesterday) {
            description = `You missed a moment yesterday. Your next risk is ${timeToNext}. Today is a new chance.`;
        } else if (smokedToday) {
            description = `One smoke logged. The chain is only as strong as the next link, which is ${timeToNext}. You can break it here.`;
        }

        return { nextMoment: next, dynamicDescription: description, timeToNext };
    }, [userProfile.moments, urges, currentTime]);

    const handleSaveReplacement = async () => {
        if (!user || !firestore || !nextMoment) return;

        const replacementValue = customReplacement || selectedReplacement;
        if (!replacementValue) {
            toast({ variant: 'destructive', title: "Input required", description: "Please choose or enter a replacement activity." });
            return;
        }

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const updatedMoments = userProfile.moments?.map(m => {
            if (m.id === nextMoment.id) {
                return {
                    ...m,
                    completed: { ...(m.completed || {}), [todayStr]: false },
                    replacementActivity: { ...(m.replacementActivity || {}), [todayStr]: replacementValue }
                };
            }
            return m;
        }) || [];

        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        try {
            await updateDoc(profileRef, { moments: updatedMoments });
            toast({ title: "Replacement Logged!", description: `Awesome choice for the ${nextMoment.time} moment!` });
            setIsDialogOpen(false);
            setCustomReplacement("");
            setSelectedReplacement("");
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: "Update Failed", description: e.message || "Could not save your replacement." });
        }
    };
    
    if (!nextMoment || !isToday(new Date())) {
        return null; // Don't show the card if there's no upcoming moment today
    }

    return (
        <Card className="border-primary/40 bg-primary/10">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <CardTitle>Next Risk Window</CardTitle>
                </div>
                <CardDescription className="pt-2">{dynamicDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 mb-4 rounded-md bg-background/50 text-left">
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className='font-mono text-sm'>{nextMoment.time}</span>
                            <span className='text-sm font-medium'>{nextMoment.label}</span>
                        </div>
                     </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full" variant="outline" size="lg">
                            <Replace className="w-5 h-5 mr-2" />
                            Replace with something good
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
                            <Button onClick={handleSaveReplacement} disabled={!selectedReplacement && !customReplacement}>
                                Save Replacement
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
