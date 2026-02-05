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
// GET Sessions - prefer public/sessions.json when present
// --------------------
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), "public", "sessions.json");
    try {
      const raw = await fs.readFile(jsonPath, "utf8");
      let parsed: any[] = [];
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        // attempt to recover from concatenated JSON objects by inserting commas
        const normalized = raw.replace(/}\s*{/g, "},\n{");
        parsed = JSON.parse("[" + normalized + "]");
      }

      const sessions = parsed.map((entry, idx) => {
        const evt = entry.event || entry;
        return {
          id: idx + 1,
          hash: entry.hash ?? entry.block_hash ?? null,
          reaction_time: evt.reaction_time ?? evt.reaction ?? 0,
          violated: Boolean(evt.violated),
          date: evt.timestamp ?? evt.date ?? evt.time ?? "",
        };
      });

      return NextResponse.json({ sessions }, { headers: corsHeaders });
    } catch (fsErr) {
      // fallback to DB-backed sessions: normalize to file-based session shape
      const dbRows = await getSessions();
      const sessions = dbRows.map((s) => ({
        id: s.id,
        hash: s.session_id ?? null,
        reaction_time: s.duration ?? s.final_score ?? s.smoothness ?? 0,
        violated: false,
        date: s.date ?? "",
      }));
      return NextResponse.json({ sessions }, { headers: corsHeaders });
    }
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
