
import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/functions';
import { FieldValue } from 'firebase-admin/firestore';
import { getNarrative } from '@/lib/narrative-vault';

interface UserProfile {
    moments?: Array<{
      id: string;
      label: string;
      time: string;
      completed: Record<string, boolean>;
      habit?: string;
    }>;
}

// Helper to protect the endpoint, allowing only same-origin requests (from the service worker)
function isAllowedRequest(req: Request): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true; // Allow all in dev for easier testing
  }
  const origin = req.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  return !!appUrl && origin === appUrl;
}

export async function POST(req: Request) {
    if (!isAllowedRequest(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, momentId, dateStr, smoked, habit } = await req.json();

        if (!userId || !momentId || !dateStr || typeof smoked !== 'boolean') {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const { db } = initializeAdminApp();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userProfile = userDoc.data() as UserProfile;
        const moments = userProfile.moments || [];
        
        const momentToUpdate = moments.find(m => m.id === momentId);

        if (!momentToUpdate) {
             // Acknowledge the request but do nothing if moment is gone
            return NextResponse.json({ ok: true, message: 'Moment not found, may have been deleted.' });
        }
        
        const updatedMoments = moments.map(m => {
            if (m.id === momentId) {
                return { ...m, completed: { ...(m.completed || {}), [dateStr]: smoked } };
            }
            return m;
        });

        const batch = db.batch();
        batch.update(userRef, { moments: updatedMoments });

        // If the user confirmed they smoked, create an urge entry
        if (smoked) {
            const { long, short } = getNarrative('planned'); // A specific narrative for planned smokes
            const urgeRef = userRef.collection('urges').doc();
            
            batch.set(urgeRef, {
              timestamp: FieldValue.serverTimestamp(),
              type: habit || momentToUpdate.habit || 'Cigarettes',
              moodBefore: 'planned',
              notes: `Logged via notification for planned moment: ${momentToUpdate.label} at ${momentToUpdate.time}`,
              narrative: long,
              shortMessage: short,
              count: 1, // Assume 1 for notification-logged smokes
              source: 'user_confirm',
            });
        }
        
        await batch.commit();

        return NextResponse.json({ ok: true, message: 'Log updated successfully.' });

    } catch (error: any) {
        console.error('[log-from-notification] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
