'use server';
/**
 * @fileOverview Generates a short, first-person narrative for a smoking urge.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { NarrateUrgeInputSchema, type NarrateUrgeInput } from '@/ai/types/narrate-urge-types';

const MODEL = 'googleai/gemini-2.5-flash';

const narrateUrgePrompt = ai.definePrompt(
  {
    name: 'narrateUrgePrompt',
    input: { schema: NarrateUrgeInputSchema },
    output: { format: 'text' },
    prompt: `You are an expert at creating short, reflective, first-person narratives. Based on the user's logged data about a smoking moment, create a single, psychological sentence from a first-person perspective.
    
    The user's data:
    - Mood Before: {{#if moodBefore}}{{moodBefore}}{{else}}an unknown feeling{{/if}}
    - Mood After: {{#if moodAfter}}{{moodAfter}}{{else}}an unknown feeling{{/if}}
    - Habit: {{habitType}}

    RULES:
    1. Always write in the first person ("I...").
    2. Keep it to a single, concise sentence.
    3. Be empathetic and non-judgmental.
    4. Connect the moods with "and then".
    5. The narrative should be in the format "I felt [mood] and then [mood]".

    EXAMPLES:
    - Input: { moodBefore: 'happy', moodAfter: 'calm', habitType: 'Cigarette' }
      Output: I felt happy and then calm.
    - Input: { moodBefore: 'happy', moodAfter: 'guilty', habitType: 'Cigarette' }
      Output: I felt happy and then guilty.
    - Input: { moodBefore: 'neutral', moodAfter: 'same', habitType: 'Cigarette' }
      Output: I felt neutral and then same.
    - Input: { moodBefore: 'lonely', moodAfter: 'guilty', habitType: 'Cigarette' }
      Output: I felt lonely and then guilty.

    Now, generate a narrative for the provided data. Your response should be a single string of text. Do not add any preamble.`,
  }
);

const narrateUrgeFlow = ai.defineFlow(
  {
    name: 'narrateUrgeFlow',
    inputSchema: NarrateUrgeInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await ai.generate({
      model: MODEL,
      prompt: narrateUrgePrompt,
      input,
    });
    return text;
  }
);

export async function narrateUrge(input: NarrateUrgeInput): Promise<string> {
  return narrateUrgeFlow(input);
}
