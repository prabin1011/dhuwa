
import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This function is now protected and can only be triggered by Cloud Scheduler
export async function POST(req: Request) {
  // IMPORTANT: Verify the request is from Cloud Scheduler
  const headersList = headers();
  if (headersList.get('X-CloudScheduler') !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

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

// Optional: support GET for quick testing in browser, but also protected
export async function GET(req: Request) {
   const headersList = headers();
   // Allow browser testing only in development, not in production
   if (process.env.NODE_ENV === 'production' && headersList.get('X-CloudScheduler') !== 'true') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
   }
   return POST(req);
}
