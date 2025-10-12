import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: decide if this request is allowed to run the job
function isAllowedRequest(): boolean {
  const h = headers();

  // Vercel environment: 'development' | 'preview' | 'production'
  const vercelEnv = process.env.VERCEL_ENV || '';
  const isNonProd = vercelEnv !== 'production';

  // Detect Cloud Scheduler / App Engine cron headers (varies by target)
  const fromScheduler =
    h.get('x-cloudscheduler') === 'true' ||
    h.get('x-appengine-cron') === 'true' ||
    (h.get('user-agent') || '').toLowerCase().includes('google-cloud-scheduler');

  // Optional shared secret (set CRON_SECRET in your env; send header x-cron-secret)
  const secret = process.env.CRON_SECRET;
  const provided = h.get('x-cron-secret');
  const secretOk = !!secret && provided === secret;

  // Allow dev/preview freely; production requires scheduler or secret
  return isNonProd || fromScheduler || secretOk;
}

export async function POST() {
  if (!isAllowedRequest()) {
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
