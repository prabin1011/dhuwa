'use server';
/**
 * @fileOverview Generates a short, creative replacement activity for a smoking break.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ReplacementSuggestionInputSchema, type ReplacementSuggestionInput } from '@/ai/types/replacement-suggestion-types';
import { gemini20Flash } from '@genkit-ai/googleai';

// Genkit Prompt
const suggestionPrompt = ai.definePrompt(
  {
    name: 'replacementSuggestionPrompt',
    input: { schema: ReplacementSuggestionInputSchema },
    output: { format: 'text' },
    prompt: `Suggest one short, actionable replacement for a {{habit}} break (~{{breakDuration}}).
One sentence. No preamble.`,
  }
);


// Genkit Flow
const replacementSuggestionFlow = ai.defineFlow(
  {
    name: 'replacementSuggestionFlow',
    inputSchema: ReplacementSuggestionInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const res = await suggestionPrompt(input, {
      model: gemini20Flash,
      temperature: 0.3,
      maxOutputTokens: 80,
    });
    return res.text.trim();
  }
);

export async function getReplacementSuggestion(input: ReplacementSuggestionInput): Promise<string> {
  return replacementSuggestionFlow(input);
}
