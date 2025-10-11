// Force Node runtime; Edge often breaks Genkit.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const insight = await getDailyInsight(body);

    if (insight.includes("Could not generate")) {
      return NextResponse.json({ error: insight }, { status: 503 });
    }
    
    return NextResponse.json({ insight });
  } catch (err: any) {
    // Log the detailed error on the server
    console.error('[daily-insight] ERROR:', err);
    
    const status = err?.message?.includes('GEMINI_API_KEY') ? 503 : 500;
    
    return NextResponse.json({ error: err?.message || 'Insight generation failed' }, { status });
  }
}
