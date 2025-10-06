import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

if (
  !process.env.GEMINI_API_KEY &&
  !process.env.GOOGLE_GENAI_API_KEY &&
  !process.env.GOOGLE_API_KEY
) {
  // Fail fast with a helpful message
  throw new Error(
    'Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY / GOOGLE_API_KEY).'
  );
}

export const ai: Ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
      apiKey:
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENAI_API_KEY ||
        process.env.GOOGLE_API_KEY!,
    }),
  ],
});
