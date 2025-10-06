'use server';
/**
 * @fileOverview This file is no longer in use. Replacement suggestions are now user-driven.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ReplacementSuggestionInputSchema, type ReplacementSuggestionInput } from '@/ai/types/replacement-suggestion-types';
import { gemini20Flash } from '@genkit-ai/googleai';

// THIS FLOW IS DEPRECATED AND NOT IN USE.

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
    // This flow is not intended to be called anymore.
    // It is kept here to avoid breaking imports but will not be used.
    return "Take a 5 minute walk.";
  }
);

export async function getReplacementSuggestion(input: ReplacementSuggestionInput): Promise<string> {
  return replacementSuggestionFlow(input);
}
