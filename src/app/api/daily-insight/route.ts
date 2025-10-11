import { NextResponse } from 'next/server';
import { getDailyInsight } from '@/ai/flows/daily-insight-flow';

export const runtime = 'nodejs';        // IMPORTANT: Genkit needs Node on Vercel
export const dynamic = 'force-dynamic'; // avoid caching issues

export async function POST(req: Request) {
  try {
    // Lightweight env pre-check so we don’t mask the real reason
    const hasKey =
      !!process.env.GEMINI_API_KEY ||
      !!process.env.GOOGLE_GENAI_API_KEY ||
      !!process.env.GOOGLE_API_KEY;

    if (!hasKey) {
      return NextResponse.json(
        {
          error:
            'Server is missing GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY). Add it to Vercel → Environment Variables (Production/Preview/Development) and redeploy.',
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const insight = await getDailyInsight(body);

    if (!insight || /Could not generate/i.test(insight)) {
      // We already log inside the flow, but log once more here with a request id
      console.error('[daily-insight] Generation returned fallback:', insight);
      return NextResponse.json({ error: insight || 'No insight' }, { status: 503 });
    }

    return NextResponse.json({ insight });
  } catch (err: any) {
    console.error('[daily-insight] ERROR:', err?.stack || err);
    const status = err?.message?.includes('API key') ? 503 : 500;
    return NextResponse.json(
      { error: err?.message || 'Insight generation failed' },
      { status }
    );
  }
}
