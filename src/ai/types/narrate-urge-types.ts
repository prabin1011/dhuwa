import { z } from 'zod';

export const NarrateUrgeInputSchema = z.object({
  timestamp: z.string().describe("The ISO 8601 timestamp of when the urge occurred."),
  moodBefore: z.string().optional().describe("The user's mood before smoking (e.g., 'stressed', 'bored')."),
  moodAfter: z.string().optional().describe("The user's mood after smoking (e.g., 'guilty', 'calm')."),
  habitType: z.string().optional().describe("The type of habit, e.g. 'Cigarette' or 'Weed'"),
});

export type NarrateUrgeInput = z.infer<typeof NarrateUrgeInputSchema>;
