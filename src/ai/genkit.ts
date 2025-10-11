import 'server-only';
import { genkit, type Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

let _ai: Ai | null = null;

/** Lazily initialize and return a singleton Genkit client (server-only). */
export function getAI(): Ai {
  if (_ai) return _ai;

  // Accept either name to avoid typos/mismatches
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY; // optional fallback if you happen to use this

  if (!apiKey) {
    // Throw so the caller (route) can return 503 with a specific message
    throw new Error(
      'Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY) in Vercel env for this environment and redeploy.'
    );
  }

  _ai = genkit({
    plugins: [googleAI({ apiKey })],
  });

  return _ai;
}
