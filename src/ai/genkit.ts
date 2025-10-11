// src/ai/genkit.ts
import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY || ''; // exact name
const _ai = apiKey
  ? genkit({ plugins: [googleAI({ apiKey })] })
  : null;

export function getAI() {
  if (!_ai) {
    throw new Error('GEMINI_API_KEY is missing; AI features are disabled.');
  }
  return _ai;
}
