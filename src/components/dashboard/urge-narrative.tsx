
'use client';

import { useEffect, useState } from "react";
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { getNarrative } from "@/lib/narrative-vault";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

interface Urge {
    timestamp: Timestamp;
    moodBefore?: string;
    moodAfter?: string;
    type?: string;
    narrative?: string;
    shortMessage?: string;
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
        // If narrative and message exist, display them.
        if (urge.narrative && urge.shortMessage) {
            setNarrative(urge.narrative);
            setShortMessage(urge.shortMessage);
            setIsLoading(false);
            return;
        }

        // If not, generate and save them.
        const generateAndSaveNarrative = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const { long, short } = getNarrative(urge.moodBefore, urge.moodAfter);
                setNarrative(long);
                setShortMessage(short);
                
                // Save the newly generated texts to Firestore
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
                const urgeRef = doc(firestore, `users/${user.uid}/urges/${urge.id}`);
                await updateDoc(urgeRef, { narrative: fallback.long, shortMessage: fallback.short });
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

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={urge.id} className="border-none">
                <AccordionTrigger className="py-2 px-1 text-xs hover:no-underline justify-between">
                   <div className="flex items-center gap-3">
                     <time className="text-muted-foreground font-mono">
                        {format(urge.timestamp.toDate(), 'h:mm a')}
                     </time>
                     <p className="text-left text-foreground/90 font-medium">
                        {shortMessage}
                     </p>
                   </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-2">
                    <p className="text-xs italic text-foreground/70">
                       “{narrative}”
                    </p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
