'use server';
/**
 * @fileOverview Generates a short, first-person narrative for a smoking urge.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { NarrateUrgeInputSchema, type NarrateUrgeInput } from '@/ai/types/narrate-urge-types';
import { gemini15Flash } from '@genkit-ai/google-genai';


const narrateUrgePrompt = ai.definePrompt(
  {
    name: 'narrateUrgePrompt',
    input: { schema: NarrateUrgeInputSchema },
    output: { format: 'text' },
    prompt: `You are an expert at creating short, reflective, first-person narratives. Based on the user's logged data about a smoking moment, create a single, "touchy" or psychological sentence.
    
    The user's data:
    - Time: {{timestamp}} (This is an ISO string, infer morning/afternoon/evening from it)
    - Mood Before: {{#if moodBefore}}{{moodBefore}}{{else}}an unknown feeling{{/if}}
    - Mood After: {{#if moodAfter}}{{moodAfter}}{{else}}an unknown feeling{{/if}}
    - Habit: {{habitType}}

    RULES:
    1.  Always write in the first person ("I...").
    2.  Keep it to a single, concise sentence.
    3.  Be empathetic and non-judgmental.
    4.  Incorporate the time of day and the moods poetically, without stating the time explicitly.
    5.  If a mood is missing, be creative (e.g., "I'm not sure how I felt...").

    EXAMPLES:
    - Input: { moodBefore: 'lonely', moodAfter: 'same', timestamp: '...T12:16:00Z' }
      Output: I felt lonely so I smoked, but the feeling is still the same.
    - Input: { moodBefore: 'happy', moodAfter: 'guilty', timestamp: '...T09:00:00Z' }
      Output: The sun was up and I smoked to celebrate a happy moment, but ended up feeling guilty.
    - Input: { moodBefore: 'stressed', moodAfter: 'calm', timestamp: '...T22:30:00Z' }
      Output: Late night stress led me to a smoke, and I feel a little calmer now.
    - Input: { moodBefore: 'bored', moodAfter: '...', timestamp: '...T15:00:00Z' }
      Output: Out of sheer boredom this afternoon, I lit one up. I'm not sure if it helped.

    Now, generate a narrative for the provided data. Your response should be a single string of text. Do not add any preamble.`,
    model: gemini15Flash,
  }
);

const narrateUrgeFlow = ai.defineFlow(
  {
    name: 'narrateUrgeFlow',
    inputSchema: NarrateUrgeInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await narrateUrgePrompt(input);
    return llmResponse.text;
  }
);

export async function narrateUrge(input: NarrateUrgeInput): Promise<string> {
  return narrateUrgeFlow(input);
}
