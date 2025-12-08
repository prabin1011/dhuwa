
'use client';

import { useEffect, useState } from "react";
import type { WithId } from "@/firebase";
import type { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Cigarette, Leaf, MinusCircle, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { narrateUrge } from "@/ai/flows/narrate-urge-flow";

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
    const locale = useLocale();
    const [narrative, setNarrative] = useState<string | null>(urge.narrative || null);
    const [isLoading, setIsLoading] = useState(!urge.narrative);

    useEffect(() => {
        if (urge.narrative) {
            setNarrative(urge.narrative);
            setIsLoading(false);
            return;
        }

        const generateAndSaveNarrative = async () => {
            if (!user || !firestore) return;
            setIsLoading(true);
            try {
                const generatedNarrative = await narrateUrge({
                    timestamp: urge.timestamp.toDate().toISOString(),
                    moodBefore: urge.moodBefore,
                    moodAfter: urge.moodAfter,
                    habitType: urge.type,
                    language: locale
                });

                setNarrative(generatedNarrative);
                
                const urgeRef = doc(firestore, `users/${user.uid}/urges/${urge.id}`);
                await updateDoc(urgeRef, { narrative: generatedNarrative });

            } catch (error) {
                console.error("Failed to generate urge narrative:", error);
                const fallback = `I felt ${urge.moodBefore || 'a feeling'}. It is what it is.`;
                setNarrative(fallback);
                if (user && firestore) {
                    const urgeRef = doc(firestore, `users/${user.uid}/urges/${urge.id}`);
                    await updateDoc(urgeRef, { narrative: fallback });
                }
            } finally {
                setIsLoading(false);
            }
        };

        generateAndSaveNarrative();
    }, [urge, user, firestore, locale]);


    if (isLoading) {
        return (
             <div className="flex items-center justify-between w-full px-1 py-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/6" />
            </div>
        )
    }

    const countLabel = urge.count && urge.count > 1 ? ` (x${urge.count})` : '';
    
    const HabitIcon = () => {
      if (urge.type === 'Vape') return <Wind className="w-3.5 h-3.5 text-blue-400" />;
      if (urge.type === 'Weed') return <Leaf className="w-3.5 h-3.5 text-purple-400" />;
      if (urge.type === 'Snus') return <MinusCircle className="w-3.5 h-3.5 text-gray-400" />;
      return <Cigarette className="w-3.5 h-3.5 text-primary" />;
    };

    return (
        <div className="w-full px-1 py-2">
            <div className="flex items-center gap-3">
              <HabitIcon />
              <time className="text-muted-foreground font-mono text-xs">
                 {format(urge.timestamp.toDate(), 'h:mm a')}
                 {countLabel}
              </time>
              <p className="text-left text-foreground/90 font-medium text-xs flex-1">
                 {urge.moodBefore}
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
