import { genkit, Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai: Ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
