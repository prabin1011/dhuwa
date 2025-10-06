import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!key) return NextResponse.json({ error: "Missing Gemini API key" }, { status: 500 });

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?key=" + key
  );
  const json = await res.json();

  // Return just the useful bits
  const models = (json.models || []).map((m: any) => ({
    name: m.name,
    methods: m.supportedGenerationMethods,
  }));
  return NextResponse.json({ models }, { status: res.ok ? 200 : 500 });
}
