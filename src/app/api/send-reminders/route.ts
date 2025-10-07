
import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await sendMomentReminders();
    // Always JSON
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[send-reminders] error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

// Optional: support GET for quick testing in browser
export async function GET() {
  return POST();
}
