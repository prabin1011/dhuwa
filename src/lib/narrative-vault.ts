

type Mood = string | undefined;

interface Narrative {
    long: string;
    short: string;
}

const templates: Record<string, Narrative[]> = {
    stressed: [
        { short: "An attempt to escape pressure.", long: "Under pressure, I reached for a cigarette. It's a familiar escape, but the relief is fleeting and the real problem remains." },
        { short: "A brief pause from the noise.", long: "The weight of the day felt heavy, so I stepped away to smoke. Did the smoke lift the weight, or just add to it?" },
        { short: "Trading stress for a toxin.", long: "In a moment of high stress, I made a trade: a few minutes of perceived calm for a dose of poison. Was it worth it?" }
    ],
    bored: [
        { short: "Filling the void with smoke.", long: "Emptiness and a lack of engagement led me to smoke. It filled the time, but not the void." },
        { short: "A familiar action for an idle mind.", long: "With nothing to do, the old habit called. It's a script I know well, but one I want to rewrite." },
        { short: "Just to have something to do.", long: "I wasn't craving, just bored. The cigarette was an activity, a ritual to pass the time. It gave my hands something to do, but my mind is still restless." }
    ],
    lonely: [
        { short: "A companion in solitude.", long: "Feeling a pang of loneliness, I lit a cigarette. It felt like a companion, but it's a friend that takes more than it gives." },
        { short: "An illusion of company.", long: "The silence was loud, so I filled it with smoke. For a moment, I wasn't alone. But the smoke clears, and the silence returns." },
        { short: "Reaching for a crutch.", long: "In a moment of isolation, I reached for a familiar crutch. It holds me up, but it also holds me back." }
    ],
    happy: [
        { short: "Punctuating joy with a poison.", long: "In a moment of pure happiness, I chose to add a cigarette. Does joy really need this chemical punctuation?" },
        { short: "The 'reward' that isn't one.", long: "I felt great, so I 'rewarded' myself with a smoke. But what is the reward? A step back from the freedom I'm seeking." },
        { short: "A shadow in a bright moment.", long: "The day was bright, my mood was high, and yet I cast a shadow over it with a cigarette. The joy was real; the smoke was an imposter." }
    ],
    tired: [
        { short: "A false promise of energy.", long: "Weariness led me to smoke, hoping for a lift. It's a false friend, offering a momentary jolt before dragging me down further." },
        { short: "Propping up tired eyes with smoke.", long: "My body craved rest, but my mind craved a cigarette. I chose the smoke. Now I feel both tired and guilty." },
        { short: "A stimulant for the weary.", long: "Exhaustion was setting in, and I used a cigarette as a stimulant. A quick fix with a long-term cost to my energy." }
    ],
    anxious: [
        { short: "Feeding the very anxiety I felt.", long: "A wave of anxiety washed over me, and my conditioned response was to smoke. The nicotine itself is a source of anxiety; I fed the monster." },
        { short: "A shaky hand lights a cigarette.", long: "My nerves were frayed, and I thought a cigarette would calm them. It's a paradox, using a stimulant to find peace." },
        { short: "The illusion of control.", long: "When things felt out of control, I grabbed for something I could control: lighting a cigarette. But in doing so, I gave up control to the addiction." }
    ],
    'daily-ritual': [
        { short: "The ghost of a habit.", long: "Not happy, not sad, just… automatic. The ghost of a million past cigarettes lit this one. It was pure, unfiltered habit." },
        { short: "An action without a reason.", long: "I can't even say why I smoked this one. It was a reflex, a twitch, a program running in the background. That's the trap." },
        { short: "Just because it's 'time'.", long: "It was time. The clock in my head struck 'smoke o'clock'. There was no real trigger, just the relentless march of the little monster." }
    ],
    neutral: [
        { short: "The ghost of a habit.", long: "Not happy, not sad, just… automatic. The ghost of a million past cigarettes lit this one. It was pure, unfiltered habit." },
        { short: "An action without a reason.", long: "I can't even say why I smoked this one. It was a reflex, a twitch, a program running in the background. That's the trap." },
        { short: "Just because it's there.", long: "It was time. The clock in my head struck 'smoke o'clock'. There was no real trigger, just the relentless march of addiction." }
    ],
    default: [
        { short: "Another link in the chain.", long: "And so, another cigarette was smoked. Each one forges the chain, but each one skipped breaks it." },
        { short: "A moment recorded.", long: "A moment, a smoke, a log. Data for the future me to understand. It is what it is." }
    ]
};

export function getNarrative(moodBefore: Mood, moodAfter: Mood = '...'): Narrative {
    // Ensure moodBefore is a valid key, otherwise use 'default'
    const beforeKey = moodBefore && templates[moodBefore] ? moodBefore : 'default';
    const templateOptions = templates[beforeKey];
    
    // This check prevents crashing if the mood key somehow doesn't exist.
    if (!templateOptions || templateOptions.length === 0) {
        return templates.default[0];
    }
    
    // Pick a random template from the options for the given mood
    const chosenTemplate = templateOptions[Math.floor(Math.random() * templateOptions.length)];
    
    // Replace the after-mood placeholder in the long narrative
    const longNarrative = chosenTemplate.long.replace('{{after}}', moodAfter || '...');

    return {
        long: longNarrative,
        short: chosenTemplate.short,
    };
}
