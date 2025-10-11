// Force Node runtime; Edge often breaks Genkit.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow';
import type { DailyInsightInput } from '@/ai/types/daily-insight-types';

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

    const insight = await getDailyInsight(parsed as DailyInsightInput);
    
    if (insight.includes("Could not generate an insight")) {
       return NextResponse.json({ error: insight }, { status: 503 });
    }

    return NextResponse.json({ insight });
  } catch (err: any) {
    // Log *everything* on the server to see real cause
    console.error('[daily-insight] ERROR:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });
    
    const status = err?.message?.includes('GEMINI_API_KEY') ? 503 : 500;

    return NextResponse.json({ error: err?.message || 'Insight generation failed' }, { status });
  }
}
