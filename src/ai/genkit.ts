
import { genkit, type Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  throw new Error('Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY / GOOGLE_API_KEY) in your environment.');
}

export const ai: Ai = genkit({
  plugins: [googleAI({ apiKey: API_KEY })],
});
