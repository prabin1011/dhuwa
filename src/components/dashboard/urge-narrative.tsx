
'use client';

import { useEffect, useState } from "react";
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { narrateUrge } from "@/ai/flows/narrate-urge-flow";
import type { NarrateUrgeInput } from "@/ai/types/narrate-urge-types";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface Urge {
    timestamp: Timestamp;
    moodBefore?: string;
    moodAfter?: string;
    type?: string;
    narrative?: string;
}

interface UrgeNarrativeProps {
    urge: WithId<Urge>;
}

export function UrgeNarrative({ urge }: UrgeNarrativeProps) {
    const { firestore, user } = useFirebase();
    const [narrative, setNarrative] = useState<string | null>(urge.narrative || null);
    const [isLoading, setIsLoading] = useState(!urge.narrative);

    useEffect(() => {
        // If narrative exists, just display it.
        if (urge.narrative) {
            setNarrative(urge.narrative);
            setIsLoading(false);
            return;
        }

        // If no narrative, generate and save it.
        const generateAndSaveNarrative = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const input: NarrateUrgeInput = {
                    timestamp: urge.timestamp.toDate().toISOString(),
                    moodBefore: urge.moodBefore,
                    moodAfter: urge.moodAfter,
                    habitType: urge.type
                };
                const result = await narrateUrge(input);
                setNarrative(result);
                
                // Save the newly generated narrative to Firestore
                const urgeRef = doc(firestore, `users/${user.uid}/urges/${urge.id}`);
                await updateDoc(urgeRef, { narrative: result });

            } catch (error) {
                console.error("Failed to generate urge narrative:", error);
                const fallbackNarrative = `Felt ${urge.moodBefore || '...'} and then ${urge.moodAfter || '...'}.`;
                setNarrative(fallbackNarrative);
                 const urgeRef = doc(firestore, `users/${user.uid}/urges/${urge.id}`);
                await updateDoc(urgeRef, { narrative: fallbackNarrative });
            } finally {
                setIsLoading(false);
            }
        };

        generateAndSaveNarrative();
    }, [urge, user, firestore]);


    if (isLoading) {
        return (
             <div className="flex items-center justify-between w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/6" />
            </div>
        )
    }

    return (
        <div className="flex items-start justify-between w-full">
            <p className="italic text-foreground/80 text-xs flex-1 pr-2">"{narrative}"</p>
            <span className="text-muted-foreground font-mono text-xs flex-shrink-0">
                {format(urge.timestamp.toDate(), "h:mm a")}
            </span>
        </div>
    );
}
