
import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: decide if this request is allowed to run the job
function isAllowedRequest(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  const origin = req.headers.get('origin');

  // Vercel Cron Job security: Check for the 'Bearer' token from the injected CRON_SECRET
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // Allow requests from the app's own origin for testing (e.g., "Test Notification" button)
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  if (origin === appUrl) {
    return true;
  }

  // Optional fallback for older schedulers
  const fromScheduler =
    req.headers.get('x-cloudscheduler') === 'true' ||
    req.headers.get('user-agent')?.toLowerCase().includes('google-cloud-scheduler');

  return fromScheduler;
}

// Vercel Cron Jobs send GET requests
export async function GET(req: Request) {
  if (!isAllowedRequest(req)) {
    console.warn(
      '[send-reminders] Unauthorized request rejected.',
      'Origin:', req.headers.get('origin'),
      'User-Agent:', req.headers.get('user-agent')
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await sendMomentReminders();
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err: any) {
    console.error('[send-reminders] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

// POST handler for manual testing
export async function POST(req: Request) {
  if (!isAllowedRequest(req)) {
    console.warn('[send-reminders] Unauthorized POST request rejected.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await sendMomentReminders();
    return NextResponse.json({
      ok: true,
      message: 'Test reminder job triggered successfully.',
      details: result,
    }, { status: 200 });
  } catch (err: any) {
    console.error('[send-reminders-post] error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to send test reminders' },
      { status: 500 }
    );
  }
}
