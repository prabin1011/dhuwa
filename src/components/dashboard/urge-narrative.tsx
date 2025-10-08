
'use client';

import { useEffect, useState } from "react";
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { getNarrative } from "@/lib/narrative-vault";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Cigarette, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface Urge {
    timestamp: Timestamp;
    moodBefore?: string;
    moodAfter?: string;
    type?: string;
    narrative?: string;
    shortMessage?: string;
    count?: number;
}

interface UrgeNarrativeProps {
    urge: WithId<Urge>;
}

export function UrgeNarrative({ urge }: UrgeNarrativeProps) {
    const { firestore, user } = useFirebase();
    const [narrative, setNarrative] = useState<string | null>(urge.narrative || null);
    const [shortMessage, setShortMessage] = useState<string | null>(urge.shortMessage || null);
    const [isLoading, setIsLoading] = useState(!urge.narrative || !urge.shortMessage);

    useEffect(() => {
        if (urge.narrative && urge.shortMessage) {
            setNarrative(urge.narrative);
            setShortMessage(urge.shortMessage);
            setIsLoading(false);
            return;
        }

        const generateAndSaveNarrative = async () => {
            if (!user || !firestore) return;
            setIsLoading(true);
            try {
                const { long, short } = getNarrative(urge.moodBefore, urge.moodAfter);
                setNarrative(long);
                setShortMessage(short);
                
                const urgeRef = doc(firestore, `users/${user.uid}/urges/${urge.id}`);
                await updateDoc(urgeRef, { narrative: long, shortMessage: short });

            } catch (error) {
                console.error("Failed to generate urge narrative:", error);
                const fallback = {
                    long: `I felt ${urge.moodBefore || 'a feeling'} and then ${urge.moodAfter || 'another'}. It is what it is.`,
                    short: "One moment at a time."
                }
                setNarrative(fallback.long);
                setShortMessage(fallback.short);
                if (user && firestore) {
                    const urgeRef = doc(firestore, `users/${user.uid}/urges/${urge.id}`);
                    await updateDoc(urgeRef, { narrative: fallback.long, shortMessage: fallback.short });
                }
            } finally {
                setIsLoading(false);
            }
        };

        generateAndSaveNarrative();
    }, [urge, user, firestore]);


    if (isLoading) {
        return (
             <div className="flex items-center justify-between w-full px-1 py-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/6" />
            </div>
        )
    }

    const countLabel = urge.count && urge.count > 1 ? ` (x${urge.count})` : '';
    const HabitIcon = urge.type === 'Weed' ? Leaf : Cigarette;
    const iconColor = urge.type === 'Weed' ? 'text-purple-400' : 'text-primary';

    return (
        <div className="w-full px-1 py-2">
            <div className="flex items-center gap-3">
              <HabitIcon className={cn("w-3.5 h-3.5", iconColor)} />
              <time className="text-muted-foreground font-mono text-xs">
                 {format(urge.timestamp.toDate(), 'h:mm a')}
                 {countLabel}
              </time>
              <p className="text-left text-foreground/90 font-medium text-xs">
                 {shortMessage}
              </p>
            </div>
            <div className="px-1 pt-2">
                <p className="text-xs italic text-foreground/70">
                   “{narrative}”
                </p>
            </div>
        </div>
    );
}
