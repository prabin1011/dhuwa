'use server';
/**
 * @fileOverview Generates a short, first-person narrative for a smoking urge.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { NarrateUrgeInputSchema, type NarrateUrgeInput } from '@/ai/types/narrate-urge-types';
import { gemini15Flash } from '@genkit-ai/googleai';


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
    1.  Always write in the first person ("I...").
    2.  Keep it to a single, concise sentence.
    3.  Be empathetic and non-judgmental.
    4.  Explicitly mention the act of smoking.
    5.  If a mood is missing, be creative (e.g., "I'm not sure how I felt...").

    EXAMPLES:
    - Input: { moodBefore: 'happy', moodAfter: 'guilty' }
      Output: I felt happy and smoked, but then I'm guilty now.
    - Input: { moodBefore: 'neutral', moodAfter: 'same' }
      Output: I felt neutral but still smoked and felt the same.
    - Input: { moodBefore: 'lonely', moodAfter: 'guilty' }
      Output: I felt lonely and smoked, and now I'm guilty again.
    - Input: { moodBefore: 'stressed', moodAfter: 'calm' }
      Output: I was feeling stressed so I smoked, and now I feel a little calmer.

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
    const llmResponse = await narrateUrgePrompt(input, { model: gemini15Flash });
    return llmResponse.text;
  }
);

export async function narrateUrge(input: NarrateUrgeInput): Promise<string> {
  return narrateUrgeFlow(input);
}
