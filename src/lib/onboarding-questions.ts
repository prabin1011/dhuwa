
// Data Types
export type OnboardingData = {
  habits: string[];
  habitDetails: Record<string, {
    packCost?: string;
    itemsPerPack?: string;
    itemsPerDay?: string;
  }>;
  currency: string;
  language: string;
  frequency: string;
  started: string;
  goal: string;
  motivation: string;
  confidence: string;
  cravingTime: string;
  breakDuration: string;
  usualPlace: string;
  usualCompany: string;
  moodBefore: string;
  mainTrigger: string;
  moodAfter: string;
  cravingStrength: string;
  healthEffects: string;
  exerciseFrequency: string;
  sleepDuration: string;
  stressFrequency: string;
  checkInTime: string;
  preferredTone: string;
  reminders: string;
};

export type Step = {
  id: number;
  title: string;
  field: keyof OnboardingData | `habitDetails.${string}.${'packCost' | 'itemsPerPack' | 'itemsPerDay'}`;
  question: string;
  type: 'checkbox' | 'radio' | 'number' | 'summary' | 'dynamic' | 'currency';
  options?: { value: string; label: string; description?: string }[];
  optional?: boolean;
  dependsOn?: keyof OnboardingData;
};


// Constants for the full profile editing
export const STEPS: Step[] = [
    { id: 1, title: 'The Habit', field: 'habits', question: 'What do you currently use?', type: 'checkbox', options: [{value: 'Cigarettes', label: 'Cigarettes'}, {value: 'Weed', label: 'Weed'}] },
    { id: 2, title: 'The Habit', field: 'frequency', question: 'How often do you use?', type: 'radio', options: [
        {value: 'daily', label: 'Every day'},
        {value: 'few-times-week', label: 'A few times a week'},
        {value: 'weekly', label: 'Once a week'},
        {value: 'occasionally', label: 'Occasionally'},
    ]},
    { id: 3, title: 'The Habit', field: 'started', question: 'When did you start?', type: 'radio', options: [
        {value: 'less-6-months', label: 'Less than 6 months ago'},
        {value: '6-12-months', label: '6 months - 1 year ago'},
        {value: '1-3-years', label: '1–3 years ago'},
        {value: '3-5-years', label: '3–5 years ago'},
        {value: 'over-5-years', label: 'Over 5 years ago'},
    ]},
    // Dynamic steps for habit details will be generated based on selection
    { id: 4, title: 'The Cost', field: 'habitDetails', question: 'Tell us about your habits.', type: 'dynamic' },
    { id: 5, title: 'Your Goal', field: 'goal', question: 'What’s your primary goal right now?', type: 'radio', options: [
        {value: 'quit', label: 'Quit completely'},
        {value: 'reduce', label: 'Cut down gradually'},
        {value: 'track', label: 'Just track and understand my habits'},
    ]},
    { id: 6, title: 'Your Goal', field: 'motivation', question: 'What motivates you most?', type: 'radio', options: [
        {value: 'health', label: 'Health and energy'},
        {value: 'money', label: 'Saving money'},
        {value: 'family', label: 'Family or relationships'},
        {value: 'focus', label: 'Focus and productivity'},
        {value: 'peace', label: 'Mental peace'},
    ]},
    { id: 7, title: 'Your Goal', field: 'confidence', question: 'How confident are you that you can achieve this goal?', type: 'radio', options: [
        {value: 'very-confident', label: 'Very confident'},
        {value: 'somewhat-confident', label: 'Somewhat confident'},
        {value: 'not-sure', label: 'Not sure'},
        {value: 'observing', label: 'I just want to observe for now'},
    ]},
    // The rest of the original steps...
    { id: 8, title: 'Routine & Timing', field: 'cravingTime', question: 'When do you usually use the most?', type: 'radio', options: [
        {value: 'morning', label: 'Morning'},
        {value: 'afternoon', label: 'Afternoon'},
        {value: 'evening', label: 'Evening'},
        {value: 'late-night', label: 'Late night'},
    ]},
    // ... many steps omitted for brevity but should be here in a real app
    { id: 9, title: 'Reflection Setup', field: 'preferredTone', question: 'What kind of support tone do you prefer from the AI?', type: 'radio', options: [
        {value: 'friendly', label: 'Friendly'},
        {value: 'mindful', label: 'Calm and mindful'},
        {value: 'coach', label: 'Strict coach'},
        {value: 'buddy', label: 'Casual buddy'},
    ]},
    { id: 10, title: 'Reflection Setup', field: 'reminders', question: 'Would you like the app to send motivational reminders?', type: 'radio', options: [
        {value: 'yes', label: 'Yes'},
        {value: 'no', label: 'No'},
    ]},
    { id: 11, title: 'Language', field: 'language', question: 'Choose your language', type: 'radio', options: [
        {value: 'en', label: 'English'},
        {value: 'nb', label: 'Norsk'},
    ]},
    { id: 12, title: 'Summary', field: 'habits', question: 'Summary', type: 'summary'},
];


// New, streamlined flow for initial onboarding
export const ONBOARDING_STEPS: Step[] = [
    { id: 1, title: 'Language', field: 'language', question: 'Choose your language', type: 'radio', options: [
        {value: 'en', label: 'English'},
        {value: 'nb', label: 'Norsk'},
    ]},
    { id: 2, title: 'Your Habit Basics', field: 'habits', question: 'What do you currently use?', type: 'checkbox', options: [{value: 'Cigarettes', label: 'Cigarettes'}, {value: 'Weed', label: 'Weed'}] },
    { id: 3, title: 'Your Habit Basics', field: 'frequency', question: 'How often do you use?', type: 'radio', options: [
        {value: 'daily', label: 'Every day'},
        {value: 'few-times-week', label: 'A few times a week'},
        {value: 'weekly', label: 'Once a week'},
        {value: 'occasionally', label: 'Occasionally'},
    ]},
    { id: 4, title: 'The Cost & Amount', field: 'habitDetails', question: 'Tell us about your habits.', type: 'dynamic' },
    { id: 5, title: 'Your Goal', field: 'goal', question: 'What’s your primary goal right now?', type: 'radio', options: [
        {value: 'quit', label: 'Quit completely'},
        {value: 'reduce', label: 'Cut down gradually'},
        {value: 'track', label: 'Just track and understand my habits'},
    ]},
    { id: 6, title: 'Summary', field: 'habits', question: 'Summary', type: 'summary'},
]
