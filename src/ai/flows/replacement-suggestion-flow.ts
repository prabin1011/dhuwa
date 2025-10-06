'use server';
/**
 * @fileOverview Generates a short, creative replacement activity for a smoking break.
 *
 * - getReplacementSuggestion - A function that returns a suggestion.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ReplacementSuggestionInputSchema, type ReplacementSuggestionInput } from '@/ai/types/replacement-suggestion-types';


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
    const llmResponse = await suggestionPrompt(input, {
      model: 'googleai/gemini-1.5-flash-latest'
    });
    return llmResponse.text;
  }
);

// This is the only function exported from the file.
export async function getReplacementSuggestion(input: ReplacementSuggestionInput): Promise<string> {
  return replacementSuggestionFlow(input);
}
