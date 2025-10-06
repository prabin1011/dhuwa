import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow'; // <-- safe on server

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
    console.error('daily-insight API error:', err);
    if (err instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input provided.', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Insight generation failed' }, { status: 500 });
  }
}
