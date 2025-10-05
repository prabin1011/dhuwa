'use client';

import { useMemo } from 'react';
import type { WithId } from '@/firebase';

interface Urge {
    mood?: string;
}

interface MoodSummaryProps {
    urges: WithId<Urge>[];
}

const MOOD_COLORS: Record<string, string> = {
    stressed: 'bg-red-400/70',
    anxious: 'bg-yellow-400/70',
    bored: 'bg-blue-400/70',
    lonely: 'bg-indigo-400/70',
    happy: 'bg-green-400/70',
    tired: 'bg-purple-400/70',
    neutral: 'bg-gray-400/70',
    default: 'bg-gray-500/70'
};

const getMoodColor = (mood: string) => MOOD_COLORS[mood] || MOOD_COLORS.default;


export function MoodSummary({ urges }: MoodSummaryProps) {
    const moodDistribution = useMemo(() => {
        const moodsCount: Record<string, number> = {};
        let total = 0;

        urges.forEach(urge => {
            if (urge.mood) {
                moodsCount[urge.mood] = (moodsCount[urge.mood] || 0) + 1;
                total++;
            }
        });

        if (total === 0) return [];
        
        return Object.entries(moodsCount).map(([mood, count]) => ({
            mood,
            percentage: (count / total) * 100,
            color: getMoodColor(mood)
        }));

    }, [urges]);

    if (moodDistribution.length === 0) {
        return <p className="text-xs text-muted-foreground mt-1">No moods logged</p>;
    }

    return (
        <div className="w-full flex h-2 rounded-full overflow-hidden mt-2" title={`Moods: ${moodDistribution.map(m => `${m.mood} (${m.percentage.toFixed(0)}%)`).join(', ')}`}>
            {moodDistribution.map(({ mood, percentage, color }) => (
                <div 
                    key={mood} 
                    className={color}
                    style={{ width: `${percentage}%` }}
                />
            ))}
        </div>
    );
}