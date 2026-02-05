import { NextResponse } from "next/server";
import { getSessions, insertSession, sessionSchema } from "@/lib/sessions";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// --------------------
// CORS SUPPORT
// --------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// CORS pre-flight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// --------------------
// GET Sessions
// --------------------
export async function GET() {
  try {
    const sessions = await getSessions();
    return NextResponse.json({ sessions }, { headers: corsHeaders });
  } catch (error) {
    console.error("[sessions][GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch sessions" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// --------------------
// POST Session
// --------------------
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const parsed = sessionSchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          issues: parsed.error.flatten(),
        },
        { status: 400, headers: corsHeaders }
      );
    }

    await insertSession(parsed.data);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("[sessions][POST]", error);
    return NextResponse.json(
      { error: "Unable to store session" },
      { status: 500, headers: corsHeaders }
    );
  }
}
