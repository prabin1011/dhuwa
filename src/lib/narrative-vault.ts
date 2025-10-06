
type Mood = string | undefined;

const templates: Record<string, (string | ((moodAfter: Mood) => string))[]> = {
    stressed: [
        "A moment of stress led me to smoke, and afterwards I felt {{after}}.",
        (after) => `Under pressure, I reached for a smoke. The result was a feeling of ${after}.`
    ],
    bored: [
        "Out of boredom, I lit one up, only to feel {{after}} afterward.",
        (after) => `Boredom was the trigger. Smoking followed, leaving me feeling ${after}.`
    ],
    lonely: [
        "Feeling lonely, I smoked, and the feeling that remained was {{after}}.",
        (after) => `In a moment of solitude, a cigarette was my companion. It left me with a sense of ${after}.`
    ],
    happy: [
        "I smoked in a moment of happiness, which then turned into feeling {{after}}.",
        (after) => `A happy moment was punctuated by a smoke, and then I felt ${after}.`
    ],
    tired: [
        "Feeling tired, I had a smoke, and it left me feeling {{after}}.",
        (after) => `Weariness led to a cigarette, and the outcome was a feeling of ${after}.`
    ],
    anxious: [
        "Anxiety pushed me to smoke, and I was left with a feeling of {{after}}.",
        (after) => `In a wave of anxiety, I smoked. The after-effect was a sense of ${after}.`
    ],
    neutral: [
        "I smoked for no particular reason, and afterward I just felt {{after}}.",
        (after) => `A neutral moment, a habitual smoke. In the end, I felt ${after}.`
    ],
    default: [
        "I had a smoke, and afterwards I felt {{after}}.",
        (after) => `A moment passed, a cigarette was smoked, and I was left feeling ${after}.`
    ]
};

export function getNarrative(moodBefore: Mood, moodAfter: Mood = '...'): string {
    const beforeKey = moodBefore && templates[moodBefore] ? moodBefore : 'default';
    const templateOptions = templates[beforeKey];
    
    // Pick a random template from the options for the given mood
    const chosenTemplate = templateOptions[Math.floor(Math.random() * templateOptions.length)];
    
    const after = moodAfter || '...';

    if (typeof chosenTemplate === 'function') {
        return chosenTemplate(after);
    }
    
    return chosenTemplate.replace('{{after}}', after);
}
