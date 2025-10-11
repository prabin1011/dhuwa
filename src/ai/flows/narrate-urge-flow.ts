'use server';
/**
 * @fileOverview Generates a short, first-person narrative for a smoking urge.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { NarrateUrgeInputSchema, type NarrateUrgeInput } from '@/ai/types/narrate-urge-types';
import { geminiPro } from '@genkit-ai/google-genai';

const narrateUrgePrompt = ai.definePrompt(
  {
    name: 'narrateUrgePrompt',
    input: { schema: NarrateUrgeInputSchema },
    output: { format: 'text' },
    prompt: `Create a single first-person sentence about this smoking moment.
Moods: before={{moodBefore}}, after={{moodAfter}}. Habit: {{habitType}}.
Empathetic, non-judgmental, concise. No preamble.`,
  }
);

const narrateUrgeFlow = ai.defineFlow(
  {
    name: 'narrateUrgeFlow',
    inputSchema: NarrateUrgeInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const {text} = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: narrateUrgePrompt.prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 60,
      },
      input: input,
    });
    return text.trim();
  }
);

export async function narrateUrge(input: NarrateUrgeInput): Promise<string> {
  return narrateUrgeFlow(input);
}
