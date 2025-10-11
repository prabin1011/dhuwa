'use server';
/**
 * @fileOverview Generates a personalized daily insight for the user based on their recent activity.
 */
import { getAI } from '@/ai/genkit';
import { DailyInsightInputSchema, type DailyInsightInput } from '@/ai/types/daily-insight-types';
import { z } from 'zod';

// Genkit Prompt
const insightPrompt = (userProfile: DailyInsightInput['userProfile']) => `You are an expert quit-smoking coach. Tone: ${userProfile.preferredTone}.
Provide 1-3 short sentences based strictly on these facts.
Goal: ${userProfile.goal}. Motivation: ${userProfile.motivation}.
Time since last smoke: {{timeSinceLastUrge}}.
Smokes in last 48h: {{recentUrges.length}}.
${userProfile.moments?.length ? `Planned moments: ${userProfile.moments.length}.` : ''}
If clear wins -> celebrate; if clear trigger/pattern -> name it; if struggling -> encourage;
otherwise give one practical tip for tomorrow. No preamble.`;


// Genkit Flow
const dailyInsightFlow = ai.defineFlow(
  {
    name: 'dailyInsightFlow',
    inputSchema: DailyInsightInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
        const ai = getAI();
        // Sanitize input
        const sanitizedInput = {
            ...input,
            recentUrges: input.recentUrges.slice(0, 10),
            userProfile: {
                goal: input.userProfile.goal ?? 'not set',
                motivation: input.userProfile.motivation ?? 'not set',
                preferredTone: input.userProfile.preferredTone ?? 'friendly',
                itemsPerDay: input.userProfile.itemsPerDay ?? 'unknown',
                moments: input.userProfile.moments ?? [],
            }
        };
        
        const { text } = await ai.generate({
          model: 'googleai/gemini-1.5-flash', // Specify the model to use
          prompt: insightPrompt(sanitizedInput.userProfile),
          input: sanitizedInput,
          config: {
            temperature: 0.3,
            maxOutputTokens: 160,
          }
        });

        return text.trim();
    } catch (e: any) {
        console.error("Daily Insight Flow Error:", e.message);
        // Return a safe, user-friendly message on failure
        return "Could not generate an insight at this time. Please check your setup.";
    }
  }
);

export async function getDailyInsight(input: DailyInsightInput): Promise<string> {
  return dailyInsightFlow(input);
}
