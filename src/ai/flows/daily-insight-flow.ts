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

const UserProfileSchema = z.object({
    goal: z.string().optional().describe("User's primary goal (e.g., 'quit', 'reduce')."),
    motivation: z.string().optional().describe("User's primary motivation."),
    preferredTone: z.string().optional().describe("Preferred AI support tone (e.g., 'friendly', 'coach')."),
});

// Define Zod schema for input. This is NOT exported.
const DailyInsightInputSchema = z.object({
  userProfile: UserProfileSchema,
  recentUrges: z.array(UrgeSchema).describe("An array of smoke urges logged in the last 48 hours."),
  timeSinceLastUrge: z.string().describe("A human-readable string for how long it's been since the last smoke (e.g., '14 hours', '3 days')."),
});
export type DailyInsightInput = z.infer<typeof DailyInsightInputSchema>;

// Genkit Prompt
const insightPrompt = ai.definePrompt(
  {
    name: 'dailyInsightPrompt',
    input: { schema: DailyInsightInputSchema },
    output: { format: 'text' },
    prompt: `You are an AI quit-smoking coach. Your tone should be {{userProfile.preferredTone}}.

    Your goal is to provide a single, short, insightful, and encouraging message to the user based on their recent activity.
    The user's primary goal is to {{userProfile.goal}} and their main motivation is {{userProfile.motivation}}.

    Here is their recent data:
    - Time since last smoke: {{timeSinceLastUrge}}
    - Smokes in the last 48 hours: {{recentUrges.length}}
    {{#if recentUrges.length}}
    - Recent moods when smoking: {{#each recentUrges}}{{this.mood}}{{#unless @last}}, {{/unless}}{{/each}}
    {{/if}}

    Analyze the data and provide ONE of the following types of messages:
    1.  If they have a significant smoke-free streak (e.g., more than 24 hours), CELEBRATE their milestone.
    2.  If you see a clear pattern (e.g., always smoking when 'stressed', high number of smokes in the evening), IDENTIFY the pattern and offer a gentle observation.
    3.  If they are struggling (many recent urges), offer ENCOURAGEMENT without judgment.
    4.  Otherwise, provide a general MOTIVATIONAL message related to their goal.

    Keep the message to 1-2 sentences. Be concise and impactful. Do not ask a question.
    
    Example of celebrating: "Over 24 hours smoke-free! That's a huge accomplishment. Keep building on this momentum."
    Example of identifying a pattern: "I notice 'boredom' came up a few times recently. Let's think about some quick activities for those moments."
    Example of encouragement: "Yesterday was tough, but today is a new chance to move towards your goal of saving money."
    
    Your response should be a single string of text. Do not add any preamble.`,
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
