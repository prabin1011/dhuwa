
// src/app/api/send-reminders/route.ts
import { NextResponse } from 'next/server';
import { sendMomentReminders } from '@/functions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    // IMPORTANT: In a real app, this endpoint should be secured!
    // Anyone could call it. A better approach is a cron job or secured Cloud Function.
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'This endpoint is for testing only.' }, { status: 403 });
    }

    try {
        const result = await sendMomentReminders();
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error('[send-reminders] ERROR:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
