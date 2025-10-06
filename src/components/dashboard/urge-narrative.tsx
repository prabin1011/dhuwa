'use client';

import { useEffect, useState } from "react";
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { narrateUrge, NarrateUrgeInput } from "@/ai/flows/narrate-urge-flow";

interface Urge {
    timestamp: Timestamp;
    moodBefore?: string;
    moodAfter?: string;
    type?: string;
}

interface UrgeNarrativeProps {
    urge: WithId<Urge>;
}

export function UrgeNarrative({ urge }: UrgeNarrativeProps) {
    const [narrative, setNarrative] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateNarrative = async () => {
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
            } catch (error) {
                console.error("Failed to generate urge narrative:", error);
                // Fallback to a simpler format on error
                setNarrative(`Felt ${urge.moodBefore || '...'} and then ${urge.moodAfter || '...'}.`);
            } finally {
                setIsLoading(false);
            }
        };

        generateNarrative();
    }, [urge]);


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
