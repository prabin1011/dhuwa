// src/ai/genkit.ts
import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialize a singleton AI client for server code.
 * We do NOT mark this file with "use server"; importing 'server-only' is enough.
 */
export const ai = (() => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Don't throw at import time in prod—APIs can still build. Consumers should guard.
    console.error('GEMINI_API_KEY is missing. Daily Insight will be disabled.');
    return null as unknown as ReturnType<typeof genkit>;
  }

  return genkit({
    plugins: [
      googleAI({ apiKey })
    ],
  });
})();
