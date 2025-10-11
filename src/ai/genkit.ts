'use server';

import { genkit, type Ai } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This function will run on the server and has access to all environment variables.
function initializeGenkit() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing Gemini API key. Set GEMINI_API_KEY in your environment.');
    // In a real app, you might want to return a disabled AI instance or handle this more gracefully.
    // For now, we'll throw an error during initialization if the key is missing on the server.
    throw new Error('Server-side configuration error: Missing GEMINI_API_KEY.');
  }

  return genkit({
    plugins: [googleAI({ apiKey })],
  });
}

// Initialize the AI instance once when the module is loaded on the server.
export const ai: Ai = initializeGenkit();
