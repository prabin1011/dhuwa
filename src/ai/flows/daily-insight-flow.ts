'use server';

import { getAI } from '@/ai/genkit';
import {
  DailyInsightInputSchema,
  type DailyInsightInput,
} from '@/ai/types/daily-insight-types';

const insightPrompt = (userProfile: DailyInsightInput['userProfile']) =>
  `You are an expert quit-smoking coach. Tone: ${userProfile.preferredTone}.
Provide 1-3 short sentences based strictly on these facts.
Goal: ${userProfile.goal}. Motivation: ${userProfile.motivation}.
Time since last smoke: {{timeSinceLastUrge}}.
Smokes in last 48h: {{recentUrges.length}}.
${userProfile.moments?.length ? `Planned moments: ${userProfile.moments.length}.` : ''}
If clear wins -> celebrate; if clear trigger/pattern -> name it; if struggling -> encourage;
otherwise give one practical tip for tomorrow. No preamble.`;

export async function getDailyInsight(
  rawInput: DailyInsightInput
): Promise<string> {
  try {
    const parsed = DailyInsightInputSchema.parse(rawInput);

    const sanitized: DailyInsightInput = {
      ...parsed,
      recentUrges: parsed.recentUrges.slice(0, 10),
      userProfile: {
        goal: parsed.userProfile.goal ?? 'not set',
        motivation: parsed.userProfile.motivation ?? 'not set',
        preferredTone: parsed.userProfile.preferredTone ?? 'friendly',
        itemsPerDay: parsed.userProfile.itemsPerDay ?? 'unknown',
        moments: parsed.userProfile.moments ?? [],
      },
    };

    const ai = getAI();

    const { text } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: insightPrompt(sanitized.userProfile),
      input: sanitized,
      config: { temperature: 0.3, maxOutputTokens: 160 },
    });

    return (text || '').trim() || 'No insight available today.';
  } catch (e: any) {
    console.error('Daily Insight Error:', e?.message ?? e);
    return 'Could not generate a daily insight right now.';
  }
}
