
import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: decide if this request is allowed to run the job
function isAllowedRequest(): boolean {
  const h = headers();
  const origin = h.get('origin');
  
  // Allow requests originating from the app's known URLs
  const appUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const allowedOrigins = [
      appUrl, 
      process.env.NEXT_PUBLIC_APP_URL, // A dedicated env var for the deployed URL
      'https://dhuwa-app.vercel.app' // Hardcode the main URL as a fallback
  ].filter(Boolean); // remove any undefined values

  if (origin && allowedOrigins.includes(origin)) {
      return true;
  }
  
  // For server-to-server calls (cron jobs), check for a secret or specific headers
  const fromScheduler =
    h.get('x-cloudscheduler') === 'true' ||
    h.get('x-appengine-cron') === 'true' ||
    (h.get('user-agent') || '').toLowerCase().includes('google-cloud-scheduler');

  const secret = process.env.CRON_SECRET;
  const provided = h.get('x-cron-secret');
  const secretOk = !!secret && provided === secret;

  return fromScheduler || secretOk;
}

export async function POST() {
  if (!isAllowedRequest()) {
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
