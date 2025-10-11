'use server';
/**
 * @fileOverview Generates a short, first-person narrative for a smoking urge.
 */
import { getAI } from '@/ai/genkit';
import { z } from 'zod';
import { NarrateUrgeInputSchema, type NarrateUrgeInput } from '@/ai/types/narrate-urge-types';

const ai = getAI();

const narrateUrgePrompt = `Create a single first-person sentence about this smoking moment.
Moods: before={{moodBefore}}, after={{moodAfter}}. Habit: {{habitType}}.
Empathetic, non-judgmental, concise. No preamble.`;

const narrateUrgeFlow = ai.defineFlow(
  {
    name: 'narrateUrgeFlow',
    inputSchema: NarrateUrgeInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const {text} = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: narrateUrgePrompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 60,
        },
        input: input,
      });
      return text.trim();
    } catch (e: any) {
        console.error("Narrate Urge Flow Error:", e.message);
        return `I felt ${input.moodBefore || 'a feeling'}. It is what it is.`;
    }
  }
);

export async function narrateUrge(input: NarrateUrgeInput): Promise<string> {
  return narrateUrgeFlow(input);
}
