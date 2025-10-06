import { z } from 'zod';

export const ReplacementSuggestionInputSchema = z.object({
  habit: z.string().describe('The habit the user is trying to replace, e.g., "smoking".'),
  breakDuration: z.string().describe('The typical duration of the break, e.g., "5-10 minutes".'),
});

export type ReplacementSuggestionInput = z.infer<typeof ReplacementSuggestionInputSchema>;
