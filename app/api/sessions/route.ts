import { NextResponse } from "next/server";
import { sessionSchema } from "@/lib/sessions";

import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
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
      // No local sessions.json — return an empty sessions array instead of hitting DB
      console.warn("[sessions][GET] sessions.json missing or unreadable, returning empty list.", fsErr?.message);
      return NextResponse.json({ sessions: [] }, { headers: corsHeaders });
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

    // If the server is configured to allow file writes (useful for local/dev), append to public/sessions.json.
    const allowFileWrite = process.env.ENABLE_SESSIONS_FILE_WRITE === "true" || process.env.NODE_ENV === "development";
    if (allowFileWrite) {
      try {
        const jsonPath = path.join(process.cwd(), "public", "sessions.json");
        const raw = await fs.readFile(jsonPath, "utf8");
        let parsedFile: any[] = [];
        try {
          parsedFile = JSON.parse(raw);
        } catch (err) {
          const normalized = raw.replace(/}\s*{/g, "},\n{");
          parsedFile = JSON.parse("[" + normalized + "]");
        }

        parsedFile.unshift({ event: parsed.data, hash: parsed.data.session_id ?? null });
        await fs.writeFile(jsonPath, JSON.stringify(parsedFile, null, 2), "utf8");
        return NextResponse.json({ success: true, persisted: true }, { headers: corsHeaders });
      } catch (err) {
        console.warn("[sessions][POST] failed to write sessions.json, continuing without persistence", err?.message);
        // fall through to respond success but not persisted
      }
    }

    // Default behavior: accept payload but do not persist (safe for serverless)
    return NextResponse.json({ success: true, persisted: false }, { headers: corsHeaders });
  } catch (error) {
    console.error("[sessions][POST]", error);
    return NextResponse.json(
      { error: "Unable to store session" },
      { status: 500, headers: corsHeaders }
    );
  }
}
