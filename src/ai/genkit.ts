// Minimal stub to unblock builds.
// Replace with your real implementation later.
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
});
