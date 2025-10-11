'use server';
/**
 * @fileOverview Generates a personalized daily insight for the user based on their recent activity.
 */
import { ai } from '@/ai/genkit';
import { DailyInsightInputSchema, type DailyInsightInput } from '@/ai/types/daily-insight-types';
import { z } from 'zod';
import { geminiPro, gemini15Flash } from '@genkit-ai/google-genai';

// Genkit Prompt
const insightPrompt = ai.definePrompt({
  name: 'dailyInsightPrompt',
  input: { schema: DailyInsightInputSchema },
  output: { format: 'text' },
  prompt: `You are an expert quit-smoking coach. Tone: {{userProfile.preferredTone}}.
Provide 1-3 short sentences based strictly on these facts.
Goal: {{userProfile.goal}}. Motivation: {{userProfile.motivation}}.
Time since last smoke: {{timeSinceLastUrge}}.
Smokes in last 48h: {{recentUrges.length}}.
{{#if userProfile.moments.length}}Planned moments: {{userProfile.moments.length}}.{{/if}}
If clear wins -> celebrate; if clear trigger/pattern -> name it; if struggling -> encourage;
otherwise give one practical tip for tomorrow. No preamble.`,
});


// Genkit Flow
const dailyInsightFlow = ai.defineFlow(
  {
    name: 'dailyInsightFlow',
    inputSchema: DailyInsightInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
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
    
    const {output} = await insightPrompt(sanitizedInput, {
      model: gemini15Flash, // Specify the model to use
      config: {
        temperature: 0.3,
        maxOutputTokens: 160,
      }
    });

    return output.trim();
  }
);

export async function getDailyInsight(input: DailyInsightInput): Promise<string> {
  return dailyInsightFlow(input);
}
