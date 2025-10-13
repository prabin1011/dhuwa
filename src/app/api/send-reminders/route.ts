
import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: decide if this request is allowed to run the job
function isAllowedRequest(request: Request): boolean {
  const h = headers();
  const authHeader = h.get('authorization');
  
  // Vercel Cron Job security: Check for the 'Bearer' token from the injected CRON_SECRET
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  
  // Allow requests from the app's own origin for testing (e.g., "Test Notification" button)
  const origin = h.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  if (origin === appUrl) {
    return true;
  }

  // Fallback for older Google Cloud Scheduler checks if needed, though Vercel's is preferred
  const fromScheduler =
    h.get('x-cloudscheduler') === 'true' ||
    h.get('user-agent')?.toLowerCase().includes('google-cloud-scheduler');
  
  if (fromScheduler) return true;
  
  return false;
}

// NOTE: Vercel Cron jobs use GET requests.
export async function GET(request: Request) {
  if (!isAllowedRequest(request)) {
    console.warn('[send-reminders] Unauthorized request rejected. Origin:', headers().get('origin'), 'User-Agent:', headers().get('user-agent'));
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

// The POST handler is now only for manual testing from the dashboard.
export async function POST(request: Request) {
    if (!isAllowedRequest(request)) {
        console.warn('[send-reminders] Unauthorized POST request rejected.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
     try {
        // We can reuse the same core logic.
        const result = await sendMomentReminders();
        return NextResponse.json({ ok: true, message: "Test reminder job triggered successfully.", details: result }, { status: 200 });
    } catch (err: any) {
        console.error('[send-reminders-post] error:', err);
        return NextResponse.json(
            { error: err?.message ?? 'Failed to send test reminders' },
            { status: 500 }
        );
    }
}
