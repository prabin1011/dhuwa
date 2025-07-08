import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Make sure the GOOGLE_API_KEY is available in the environment.
// The .env file should be picked up by Next.js automatically.
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  // This will log on the server if the key is missing.
  console.error("GOOGLE_API_KEY environment variable not set.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
