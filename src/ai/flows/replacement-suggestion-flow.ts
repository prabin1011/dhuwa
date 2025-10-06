'use server';
/**
 * @fileOverview Generates a short, creative replacement activity for a smoking break.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ReplacementSuggestionInputSchema, type ReplacementSuggestionInput } from '@/ai/types/replacement-suggestion-types';

const MODEL = 'gemini-2.5-flash';

// Genkit Prompt
const suggestionPrompt = ai.definePrompt(
  {
    name: 'replacementSuggestionPrompt',
    input: { schema: ReplacementSuggestionInputSchema },
    output: { format: 'text' },
    prompt: `A user wants a quick, creative, and positive replacement activity for a {{habit}} break that typically lasts {{breakDuration}}. 
    
    Provide one short, actionable suggestion.
    
    Examples:
    - Quickly solve a mini crossword puzzle.
    - Write down three things you're grateful for.
    - Step outside and identify three interesting cloud shapes.
    - Do 10 quick desk stretches.
    
    Your suggestion should be a single sentence. Do not add any preamble.`,
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
    const { text } = await ai.generate({
      model: MODEL,
      prompt: suggestionPrompt,
      input,
    });
    return text;
  }
);

export async function getReplacementSuggestion(input: ReplacementSuggestionInput): Promise<string> {
  return replacementSuggestionFlow(input);
}
