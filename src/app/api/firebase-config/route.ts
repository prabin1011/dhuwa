import { NextResponse } from 'next/server';
import { getFirebaseConfig } from '@/firebase/config';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getFirebaseConfig();
    return NextResponse.json(config);
  } catch (e: any) {
    return NextResponse.json({ error: "Firebase config not found or is invalid." }, { status: 500 });
  }
}
