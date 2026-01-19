// This file is now primarily for reference, as the SW handles the text directly.
// Keeping it allows for potential future use where templates might be fetched or varied.

export const REMINDER_TEMPLATES = {
    nudge: {
        title: "A Moment of Choice",
        body: "Your planned smoke for '{{label}}' is in 5 minutes. Is this what you truly want, or is it just the habit talking?"
    },
    checkin: {
        title: "Checking In: '{{label}}'",
        body: "The moment has passed. Did you end up smoking?"
    }
};

// Kept for backward compatibility or other potential uses, but nudge/checkin is preferred.
export const LEGACY_REMINDER_TEMPLATES = [
    {
        title: "A Moment of Choice",
        body: "Your planned smoke for '{{label}}' is in 5 minutes. Is this what you truly want, or is it just the habit talking?"
    },
    {
        title: "The Urge is a Wave",
        body: "In 5 minutes, you planned to smoke. Remember: you can ride this wave. It will pass. You are the sky, the urge is just a cloud."
    },
    {
        title: "A Message From Your Future Self",
        body: "In 5 minutes, a choice arrives. The 'you' of tomorrow is hoping you choose fresh air. What will you decide for '{{label}}'?"
    },
];

export const LEGACY_CONFIRMATION_TEMPLATES = [
    {
        title: "Checking In: '{{label}}'",
        body: "The moment has passed. Did you end up smoking?"
    },
    {
        title: "How did '{{label}}' go?",
        body: "A quick log helps you see your patterns. Did you smoke?"
    },
];
