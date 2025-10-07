// src/app/api/firebase-config/route.ts

import { NextResponse } from 'next/server';
import { getFirebaseConfig } from '@/firebase/config';

export function GET() {
  try {
    const config = getFirebaseConfig();
    // We only return the necessary client-side config
    return NextResponse.json({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        measurementId: config.measurementId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
