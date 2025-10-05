'use server';
/**
 * @fileOverview Generates a personalized daily insight for the user based on their recent activity.
 *
 * - getDailyInsight - A function that returns a coaching message.
 * - DailyInsightInput - The input type for the flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const UrgeSchema = z.object({
    id: z.string(),
    timestamp: z.string().describe("ISO 8601 date string"),
    mood: z.string().optional(),
});

const MomentSchema = z.object({
    id: z.string(),
    time: z.string(),
    label: z.string(),
    completed: z.record(z.boolean()),
    replacementActivity: z.record(z.string()).optional().describe("A map of dates to replacement activities."),
});

const UserProfileSchema = z.object({
    goal: z.string().optional().describe("User's primary goal (e.g., 'quit', 'reduce')."),
    motivation: z.string().optional().describe("User's primary motivation."),
    preferredTone: z.string().optional().describe("Preferred AI support tone (e.g., 'friendly', 'coach')."),
    itemsPerDay: z.string().optional().describe("User's average consumption."),
    moments: z.array(MomentSchema).optional().describe("User's planned smoking moments."),
});

// Define Zod schema for input. This is NOT exported.
const DailyInsightInputSchema = z.object({
  userProfile: UserProfileSchema,
  recentUrges: z.array(UrgeSchema).describe("An array of smoke urges logged in the last 48 hours."),
  timeSinceLastUrge: z.string().describe("A human-readable string for how long it's been since the last smoke (e.g., '14 hours ago', '3 days ago')."),
});
export type DailyInsightInput = z.infer<typeof DailyInsightInputSchema>;

// Genkit Prompt
const insightPrompt = ai.definePrompt(
  {
    name: 'dailyInsightPrompt',
    input: { schema: DailyInsightInputSchema },
    output: { format: 'text' },
    prompt: `You are an expert AI quit-smoking coach. Your tone should be {{userProfile.preferredTone}}.

    Your goal is to provide a single, short, insightful, and encouraging message (1-3 sentences) to the user based on their real-time activity and profile.
    The user's primary goal is to {{userProfile.goal}} and their main motivation is {{userProfile.motivation}}.

    Here is their recent data:
    - Time since last smoke: {{timeSinceLastUrge}}
    - Smokes in the last 48 hours: {{recentUrges.length}}
    {{#if recentUrges.length}}
    - Recent moods when smoking: {{#each recentUrges}}{{this.mood}}{{#unless @last}}, {{/unless}}{{/each}}
    {{/if}}
    {{#if userProfile.moments}}
    - They have {{userProfile.moments.length}} planned smoking moments.
    {{/if}}

    Analyze all the data provided and provide ONE of the following types of messages:
    1.  If they have a significant smoke-free streak (e.g., more than 12 hours), CELEBRATE their milestone. Connect it to their motivation (e.g., "It's been over 12 hours since your last smoke! That's 12 hours of letting your lungs heal for your health goal!").
    2.  If you see a clear pattern (e.g., always smoking when 'stressed', multiple smokes in a short period), IDENTIFY the pattern and offer a gentle, forward-looking observation. (e.g., "I notice 'stress' is a common trigger. What's one small thing we can do differently next time stress appears?").
    3.  If the user has logged replacement activities, PRAISE their effort specifically. (e.g., "Great job replacing your morning coffee smoke with reading! That's a huge win.").
    4.  If they are struggling (many recent urges, or more than their average of {{userProfile.itemsPerDay}}), offer ENCOURAGEMENT and a gentle warning. Frame it positively. (e.g., "It seems like a tough day. Remember, each urge you overcome makes you stronger. Inhaling more nicotine than usual can set back your health goals, but you can get back on track.").
    5.  Otherwise, provide a general MOTIVATIONAL message related to their primary goal or a general wellness tip. (e.g., "Remember your goal to save money. Every cigarette skipped is a deposit in your future fund.")

    Keep the message to 1-3 sentences. Be concise, impactful, and act as a companion. Your response should be a single string of text. Do not add any preamble.`,
  }
);


// Genkit Flow
const dailyInsightFlow = ai.defineFlow(
  {
    name: 'dailyInsightFlow',
    inputSchema: DailyInsightInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Sanitize urges: limit to 10 to avoid overwhelming the prompt
    const sanitizedInput = {
        ...input,
        recentUrges: input.recentUrges.slice(0, 10),
    };
    const llmResponse = await insightPrompt(sanitizedInput);
    return llmResponse.text;
  }
);

// This is the only function exported from the file.
export async function getDailyInsight(input: DailyInsightInput): Promise<string> {
  return dailyInsightFlow(input);
}
