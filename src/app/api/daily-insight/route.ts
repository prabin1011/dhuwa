// Force Node runtime; Edge often breaks Genkit.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow';

const MomentSchema = z.object({
  id: z.string(),
  time: z.string(),
  label: z.string(),
  completed: z.record(z.boolean()),
  replacementActivity: z.record(z.string()).optional(),
});

const InputSchema = z.object({
  userProfile: z.object({
    goal: z.string().optional(),
    motivation: z.string().optional(),
    preferredTone: z.string().optional(),
    itemsPerDay: z.string().optional(),
    moments: z.array(MomentSchema).optional(),
  }),
  recentUrges: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    mood: z.string().optional(),
  })),
  timeSinceLastUrge: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = InputSchema.parse(body);

    const insight = await getDailyInsight(parsed);
    return NextResponse.json({ insight });
  } catch (err: any) {
    // Log *everything* on the server to see real cause
    console.error('[daily-insight] ERROR:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      cause: err?.cause,
    });

    // Show a helpful hint in dev
    const hint =
      process.env.NODE_ENV !== 'production'
        ? err?.message || 'Insight generation failed'
        : 'Insight generation failed';

    const status = err instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: hint }, { status });
  }
}
