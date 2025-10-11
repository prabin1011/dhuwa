import 'server-only';
import { genkit, type Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

let _ai: Ai | null = null;

/**
 * Lazily initialize and return a singleton Genkit client.
 * This only runs on the server (due to `server-only`).
 */
export function getAI(): Ai {
  if (_ai) return _ai;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Throw here so callers can catch and return a friendly message
    throw new Error('Missing GEMINI_API_KEY (set it in your env for server runtime).');
  }

  _ai = genkit({
    plugins: [googleAI({ apiKey })],
  });

  return _ai;
}
