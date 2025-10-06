
// Data Types
export type OnboardingData = {
  habits: string[];
  frequency: string;
  started: string;
  packCost: string;
  itemsPerPack: string;
  singleCost: string;
  itemsPerDay: string;
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
  field: keyof OnboardingData;
  question: string;
  type: 'checkbox' | 'radio' | 'number' | 'summary';
  options?: { value: string; label: string; description?: string }[];
  optional?: boolean;
};


// Constants for the full profile editing
export const STEPS: Step[] = [
    { id: 1, title: 'The Habit', field: 'habits', question: 'What do you currently use?', type: 'checkbox', options: [{value: 'Cigarettes', label: 'Cigarettes'}, {value: 'Weed', label: 'Weed'}] },
    { id: 2, title: 'The Habit', field: 'frequency', question: 'How often do you smoke?', type: 'radio', options: [
        {value: 'daily', label: 'Every day'},
        {value: 'few-times-week', label: 'A few times a week'},
        {value: 'weekly', label: 'Once a week'},
        {value: 'occasionally', label: 'Occasionally'},
    ]},
    { id: 3, title: 'The Habit', field: 'started', question: 'When did you start smoking?', type: 'radio', options: [
        {value: 'less-6-months', label: 'Less than 6 months ago'},
        {value: '6-12-months', label: '6 months - 1 year ago'},
        {value: '1-3-years', label: '1–3 years ago'},
        {value: '3-5-years', label: '3–5 years ago'},
        {value: 'over-5-years', label: 'Over 5 years ago'},
    ]},
    { id: 4, title: 'The Cost', field: 'packCost', question: 'What is the average cost of a pack or unit?', type: 'number'},
    { id: 5, title: 'The Cost', field: 'itemsPerPack', question: 'How many items are in one pack/unit?', type: 'number'},
    { id: 6, title: 'The Cost', field: 'singleCost', question: 'If you buy singles, how much do you pay? (optional)', type: 'number', optional: true},
    { id: 7, title: 'The Cost', field: 'itemsPerDay', question: 'On average, how many do you consume per day?', type: 'radio', options: [
        {value: '1-5', label: '1-5'},
        {value: '6-10', label: '6-10'},
        {value: '11-15', label: '11-15'},
        {value: '16-20', label: '16-20'},
        {value: '20+', label: 'More than 20'},
    ]},
    { id: 8, title: 'Your Goal', field: 'goal', question: 'What’s your primary goal right now?', type: 'radio', options: [
        {value: 'quit', label: 'Quit completely'},
        {value: 'reduce', label: 'Cut down gradually'},
        {value: 'track', label: 'Just track and understand my habits'},
    ]},
    { id: 9, title: 'Your Goal', field: 'motivation', question: 'What motivates you most?', type: 'radio', options: [
        {value: 'health', label: 'Health and energy'},
        {value: 'money', label: 'Saving money'},
        {value: 'family', label: 'Family or relationships'},
        {value: 'focus', label: 'Focus and productivity'},
        {value: 'peace', label: 'Mental peace'},
    ]},
    { id: 10, title: 'Your Goal', field: 'confidence', question: 'How confident are you that you can achieve this goal?', type: 'radio', options: [
        {value: 'very-confident', label: 'Very confident'},
        {value: 'somewhat-confident', label: 'Somewhat confident'},
        {value: 'not-sure', label: 'Not sure'},
        {value: 'observing', label: 'I just want to observe for now'},
    ]},
    { id: 11, title: 'Routine & Timing', field: 'cravingTime', question: 'When do you usually smoke the most?', type: 'radio', options: [
        {value: 'morning', label: 'Morning'},
        {value: 'afternoon', label: 'Afternoon'},
        {value: 'evening', label: 'Evening'},
        {value: 'late-night', label: 'Late night'},
    ]},
    { id: 12, title: 'Routine & Timing', field: 'breakDuration', question: 'How long does a typical smoke break last?', type: 'radio', options: [
        {value: 'less-5-min', label: 'Less than 5 minutes'},
        {value: '5-10-min', label: '5–10 minutes'},
        {value: '10-20-min', label: '10–20 minutes'},
        {value: 'more-20-min', label: 'More than 20 minutes'},
    ]},
    { id: 13, title: 'Routine & Timing', field: 'usualPlace', question: 'Where do you usually smoke?', type: 'radio', options: [
        {value: 'home', label: 'Home'},
        {value: 'work', label: 'Work/School'},
        {value: 'bar', label: 'Bar/Café'},
        {value: 'outside', label: 'Outside/Public'},
        {value: 'other', label: 'Other'},
    ]},
    { id: 14, title: 'Routine & Timing', field: 'usualCompany', question: 'Who are you usually with?', type: 'radio', options: [
        {value: 'alone', label: 'Alone'},
        {value: 'friends', label: 'Friends'},
        {value: 'colleagues', label: 'Colleagues'},
        {value: 'partner', label: 'Partner'},
        {value: 'strangers', label: 'Strangers'},
    ]},
    { id: 15, title: 'Moods & Triggers', field: 'moodBefore', question: 'What do you usually feel before smoking?', type: 'radio', options: [
        {value: 'stressed', label: 'Stressed'},
        {value: 'bored', label: 'Bored'},
        {value: 'lonely', label: 'Lonely'},
        {value: 'happy', label: 'Happy'},
        {value: 'tired', label: 'Tired'},
        {value: 'anxious', label: 'Anxious'},
        {value: 'neutral', label: 'Neutral'},
    ]},
    { id: 16, title: 'Moods & Triggers', field: 'mainTrigger', question: 'What’s the biggest reason you light up?', type: 'radio', options: [
        {value: 'relax', label: 'To relax'},
        {value: 'socialize', label: 'To socialize'},
        {value: 'habit', label: 'Out of habit'},
        {value: 'focus', label: 'To focus'},
        {value: 'cope', label: 'To cope with stress'},
        {value: 'celebrate', label: 'To celebrate'},
    ]},
    { id: 17, title: 'Moods & Triggers', field: 'moodAfter', question: 'How do you usually feel afterward?', type: 'radio', options: [
        {value: 'calm', label: 'Calm'},
        {value: 'guilty', label: 'Guilty'},
        {value: 'energized', label: 'Energized'},
        {value: 'sleepy', label: 'Sleepy'},
        {value: 'same', label: 'The same'},
    ]},
    { id: 18, title: 'Moods & Triggers', field: 'cravingStrength', question: 'How strong are your cravings usually?', type: 'radio', options: [
        {value: 'very-strong', label: 'Very strong'},
        {value: 'moderate', label: 'Moderate'},
        {value: 'mild', label: 'Mild'},
        {value: 'rarely', label: 'Rarely crave'},
    ]},
    { id: 19, title: 'Health & Awareness', field: 'healthEffects', question: 'Have you noticed any health effects recently?', type: 'radio', options: [
        {value: 'cough', label: 'Cough or breath issues'},
        {value: 'sleep', label: 'Poor sleep'},
        {value: 'anxiety', label: 'Anxiety or mood swings'},
        {value: 'energy', label: 'Low energy'},
        {value: 'none', label: 'None noticeable'},
    ]},
    { id: 20, title: 'Health & Awareness', field: 'exerciseFrequency', question: 'How often do you exercise?', type: 'radio', options: [
        {value: 'daily', label: 'Daily'},
        {value: '2-3-week', label: '2–3 times a week'},
        {value: 'weekly', label: 'Once a week'},
        {value: 'rarely', label: 'Rarely'},
    ]},
    { id: 21, title: 'Health & Awareness', field: 'sleepDuration', question: 'How much sleep do you get daily?', type: 'radio', options: [
        {value: 'less-5', label: 'Less than 5 hours'},
        {value: '5-7', label: '5–7 hours'},
        {value: '7-9', label: '7–9 hours'},
        {value: 'more-9', label: 'More than 9 hours'},
    ]},
    { id: 22, title: 'Health & Awareness', field: 'stressFrequency', question: 'How often do you feel stressed?', type: 'radio', options: [
        {value: 'very-often', label: 'Very often'},
        {value: 'sometimes', label: 'Sometimes'},
        {value: 'rarely', label: 'Rarely'},
        {value: 'almost-never', label: 'Almost never'},
    ]},
    { id: 23, title: 'Reflection Setup', field: 'checkInTime', question: 'When would you prefer daily or weekly check-ins?', type: 'radio', options: [
        {value: 'morning', label: 'Morning'},
        {value: 'afternoon', label: 'Afternoon'},
        {value: 'evening', label: 'Evening'},
        {value: 'night', label: 'Night'},
    ]},
    { id: 24, title: 'Reflection Setup', field: 'preferredTone', question: 'What kind of support tone do you prefer from the AI?', type: 'radio', options: [
        {value: 'friendly', label: 'Friendly'},
        {value: 'mindful', label: 'Calm and mindful'},
        {value: 'coach', label: 'Strict coach'},
        {value: 'buddy', label: 'Casual buddy'},
    ]},
    { id: 25, title: 'Reflection Setup', field: 'reminders', question: 'Would you like the app to send motivational reminders?', type: 'radio', options: [
        {value: 'daily', label: 'Yes, daily'},
        {value: 'weekly', label: 'Yes, weekly'},
        {value: 'slipping', label: 'Only when I’m slipping'},
        {value: 'no', label: 'No reminders please'},
    ]},
  { id: 26, title: 'Summary', field: 'habits', question: 'Summary', type: 'summary'},
];


// New, streamlined flow for initial onboarding
export const ONBOARDING_STEPS: Step[] = [
    { id: 1, title: 'Your Habit Basics', field: 'habits', question: 'What do you currently use?', type: 'checkbox', options: [{value: 'Cigarettes', label: 'Cigarettes'}, {value: 'Weed', label: 'Weed'}] },
    { id: 2, title: 'Your Habit Basics', field: 'frequency', question: 'How often do you smoke?', type: 'radio', options: [
        {value: 'daily', label: 'Every day'},
        {value: 'few-times-week', label: 'A few times a week'},
        {value: 'weekly', label: 'Once a week'},
        {value: 'occasionally', label: 'Occasionally'},
    ]},
    { id: 3, title: 'Your Smoking History', field: 'started', question: 'When did you start smoking?', type: 'radio', options: [
        {value: 'less-6-months', label: 'Less than 6 months ago'},
        {value: '6-12-months', label: '6 months - 1 year ago'},
        {value: '1-3-years', label: '1–3 years ago'},
        {value: '3-5-years', label: '3–5 years ago'},
        {value: 'over-5-years', label: 'Over 5 years ago'},
    ]},
    { id: 4, title: 'Your Smoking History', field: 'itemsPerDay', question: 'On average, how many do you consume per day?', type: 'radio', options: [
        {value: '1-5', label: '1-5'},
        {value: '6-10', label: '6-10'},
        {value: '11-15', label: '11-15'},
        {value: '16-20', label: '16-20'},
        {value: '20+', label: 'More than 20'},
    ]},
    { id: 5, title: 'The Cost', field: 'packCost', question: 'What is the average cost of a pack or unit?', type: 'number'},
    { id: 6, title: 'The Cost', field: 'itemsPerPack', question: 'How many items are in one pack/unit?', type: 'number'},
    { id: 7, title: 'The Cost', field: 'singleCost', question: 'If you buy singles, how much do you pay? (optional)', type: 'number', optional: true},
    { id: 8, title: 'Your Goal', field: 'goal', question: 'What’s your primary goal right now?', type: 'radio', options: [
        {value: 'quit', label: 'Quit completely'},
        {value: 'reduce', label: 'Cut down gradually'},
        {value: 'track', label: 'Just track and understand my habits'},
    ]},
    { id: 9, title: 'Summary', field: 'habits', question: 'Summary', type: 'summary'},
]
