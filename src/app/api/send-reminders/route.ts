
import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This function is protected and can only be triggered by Cloud Scheduler in production.
export async function POST(req: Request) {
  const headersList = headers();
  const isScheduler = headersList.get('X-CloudScheduler') === 'true';
  const isDev = process.env.NODE_ENV === 'development';

  // IMPORTANT: Verify the request is from Cloud Scheduler OR we are in a dev environment.
  if (!isScheduler && !isDev) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const result = await sendMomentReminders();
    // Always return a JSON response
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[send-reminders] error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
