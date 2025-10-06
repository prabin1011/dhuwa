import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: 'Say OK.',
    });
    return NextResponse.json({ ok: true, text });
  } catch (e: any) {
    console.error('[ping-ai] error', e?.message);
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
