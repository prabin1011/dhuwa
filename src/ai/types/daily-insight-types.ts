import { z } from 'zod';

const UrgeSchema = z.object({
    id: z.string(),
    timestamp: z.string().describe("ISO 8601 date string"),
    mood: z.string().optional(),
});

const MomentSchema = z.object({
    id: z.string(),
    time: z.string(),
    label: z.string(),
    completed: z.record(z.boolean()),
    replacementActivity: z.record(z.string()).optional().describe("A map of dates to replacement activities."),
});

const UserProfileSchema = z.object({
    goal: z.string().optional().describe("User's primary goal (e.g., 'quit', 'reduce')."),
    motivation: z.string().optional().describe("User's primary motivation."),
    preferredTone: z.string().optional().describe("Preferred AI support tone (e.g., 'friendly', 'coach')."),
    itemsPerDay: z.string().optional().describe("User's average consumption."),
    moments: z.array(MomentSchema).optional().describe("User's planned smoking moments."),
});

export const DailyInsightInputSchema = z.object({
  userProfile: UserProfileSchema,
  recentUrges: z.array(UrgeSchema).describe("An array of smoke urges logged in the last 48 hours."),
  timeSinceLastUrge: z.string().describe("A human-readable string for how long it's been since the last smoke (e.g., '14 hours ago', '3 days ago')."),
});

export type DailyInsightInput = z.infer<typeof DailyInsightInputSchema>;
