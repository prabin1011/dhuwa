'use server';

import { ai } from '@/ai/genkit';
import {
  NarrateUrgeInputSchema,
  type NarrateUrgeInput,
} from '@/ai/types/narrate-urge-types';

const MODEL_ID = 'googleai/gemini-1.5-flash';

const narrateUrgePrompt = `Create a single first-person sentence about this smoking moment in {{language}}.
Moods: before={{moodBefore}}, after={{moodAfter}}. Habit: {{habitType}}.
Tone: Empathetic, non-judgmental, concise. No preamble.`;

function renderPrompt(template: string, values: Record<string, string | undefined>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? 'not set');
}

export async function narrateUrge(
  rawInput: NarrateUrgeInput
): Promise<string> {
  try {
    const input = NarrateUrgeInputSchema.parse(rawInput);
    const language = input.language === 'nb' ? 'Norwegian' : 'English';

    const { text } = await ai.generate({
      model: MODEL_ID,
      prompt: renderPrompt(narrateUrgePrompt, { ...input, language }),
      config: { temperature: 0.3, maxOutputTokens: 60 },
    });

    return (text || '').trim() || `I noticed that moment and how it felt.`;
  } catch (e: any) {
    console.error('Narrate Urge Error:', e?.message ?? e);
    // Return a safe fallback instead of throwing, which crashes the client
    return `I felt ${rawInput?.moodBefore || 'a feeling'}. It is what it is.`;
  }
}
