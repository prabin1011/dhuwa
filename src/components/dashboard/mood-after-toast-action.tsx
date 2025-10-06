'use client';

import { doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface MoodAfterToastActionProps {
    urgeId: string;
}

const AFTER_MOOD_OPTIONS = [
    { value: 'guilty', label: 'Guilty', emoji: '😔' },
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'same', label: 'Same', emoji: '😐' },
]

export function MoodAfterToastAction({ urgeId }: MoodAfterToastActionProps) {
    const { firestore, user } = useFirebase();
    const { dismiss } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleMoodSelect = async (mood: string) => {
        if (!user || !firestore || !urgeId) return;
        setIsSubmitted(true); // Disable buttons immediately

        const urgeRef = doc(firestore, `users/${user.uid}/urges/${urgeId}`);
        
        try {
            await updateDoc(urgeRef, { moodAfter: mood });
             setTimeout(() => dismiss(), 500); // Dismiss toast after a short delay
        } catch (error) {
            console.error("Failed to update moodAfter:", error);
            // Optionally show another toast for failure
        }
    };

    return (
        <div className="w-full mt-2">
            <p className="text-sm font-medium mb-2 text-foreground/80">How do you feel afterward?</p>
            <div className="flex gap-2">
                {AFTER_MOOD_OPTIONS.map(mood => (
                    <Button
                        key={mood.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoodSelect(mood.value)}
                        disabled={isSubmitted}
                        className="flex-1"
                    >
                       <span className="mr-2">{mood.emoji}</span> {mood.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
