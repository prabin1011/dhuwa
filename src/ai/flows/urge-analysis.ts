'use server';

/**
 * @fileOverview An AI agent that analyzes a user's urge journal entries to identify triggers and patterns.
 *
 * - analyzeUrgeJournal - A function that handles the analysis of urge journal entries.
 * - UrgeAnalysisInput - The input type for the analyzeUrgeJournal function.
 * - UrgeAnalysisOutput - The return type for the analyzeUrgeJournal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UrgeAnalysisInputSchema = z.object({
  journalEntries: z
    .string()
    .describe(
      'A string containing the user smoking urge logs, separated by newlines. Each line should contain date, time, location, trigger, and urge intensity.'
    ),
});
export type UrgeAnalysisInput = z.infer<typeof UrgeAnalysisInputSchema>;

const UrgeAnalysisOutputSchema = z.object({
  summary: z.string().describe('A summary of the user smoking logs.'),
  triggers: z
    .array(z.string())
    .describe('The list of common triggers identified from the logs.'),
  patterns: z
    .string()
    .describe('A description of the patterns observed in the user smoking urges.'),
  copingStrategies:
    z.string().describe('Suggested coping strategies for the user based on the logs.'),
});
export type UrgeAnalysisOutput = z.infer<typeof UrgeAnalysisOutputSchema>;

export async function analyzeUrgeJournal(input: UrgeAnalysisInput): Promise<UrgeAnalysisOutput> {
  return urgeAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'urgeAnalysisPrompt',
  input: {schema: UrgeAnalysisInputSchema},
  output: {schema: UrgeAnalysisOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing user smoking urge journal entries.

  Analyze the following journal entries to identify triggers, patterns, and suggest coping strategies to manage and reduce future cravings. Use the summary, triggers, patterns, and copingStrategies output fields.

  Journal Entries:
  {{journalEntries}}`,
});

const urgeAnalysisFlow = ai.defineFlow(
  {
    name: 'urgeAnalysisFlow',
    inputSchema: UrgeAnalysisInputSchema,
    outputSchema: UrgeAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
