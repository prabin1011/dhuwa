'use server';

import { getAI } from '@/ai/genkit';
import {
  NarrateUrgeInputSchema,
  type NarrateUrgeInput,
} from '@/ai/types/narrate-urge-types';

const narrateUrgePrompt = `Create a single first-person sentence about this smoking moment.
Moods: before={{moodBefore}}, after={{moodAfter}}. Habit: {{habitType}}.
Empathetic, non-judgmental, concise. No preamble.`;

/** Generate a short first-person narrative for an urge (lazy AI init). */
export async function narrateUrge(
  rawInput: NarrateUrgeInput
): Promise<string> {
  try {
    const input = NarrateUrgeInputSchema.parse(rawInput);
    const ai = getAI();

    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: narrateUrgePrompt,
      input,
      config: {
        temperature: 0.3,
        maxOutputTokens: 60,
      },
    });

    return (text || '').trim() || `I noticed that moment and how it felt.`;
  } catch (e: any) {
    console.error('Narrate Urge Error:', e?.message ?? e);
    return `I felt ${rawInput?.moodBefore || 'a feeling'}. It is what it is.`;
  }
}
