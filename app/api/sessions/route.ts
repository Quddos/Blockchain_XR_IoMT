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
      let parsed: unknown[] = [];
      try {
        parsed = JSON.parse(raw) as unknown[];
      } catch {
        // attempt to recover from concatenated JSON objects by inserting commas
        const normalized = raw.replace(/}\s*{/g, "},\n{");
        parsed = JSON.parse("[" + normalized + "]") as unknown[];
      }

      const sessions = parsed.map((entry, idx) => {
        const e = (entry && typeof entry === "object" ? entry as Record<string, unknown> : {}) as Record<string, unknown>;
        const evt = (e.event && typeof e.event === "object" ? e.event as Record<string, unknown> : e);
        const get = (obj: Record<string, unknown>, keys: string[]) => {
          for (const k of keys) {
            if (k in obj && obj[k] != null) return obj[k];
          }
          return undefined;
        };
        return {
          id: idx + 1,
          hash: (get(e, ["hash", "block_hash"]) as string) ?? null,
          reaction_time: (get(evt as Record<string, unknown>, ["reaction_time", "reaction"]) as number) ?? 0,
          violated: Boolean(get(evt as Record<string, unknown>, ["violated"])),
          date: String(get(evt as Record<string, unknown>, ["timestamp", "date", "time"]) ?? ""),
        };
      });

      return NextResponse.json({ sessions }, { headers: corsHeaders });
    } catch (fsErr) {
      // No local sessions.json — return an empty sessions array instead of hitting DB
      console.warn("[sessions][GET] sessions.json missing or unreadable, returning empty list.", String(fsErr));
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
        let parsedFile: unknown[] = [];
        try {
          parsedFile = JSON.parse(raw) as unknown[];
        } catch {
          const normalized = raw.replace(/}\s*{/g, "},\n{");
          parsedFile = JSON.parse("[" + normalized + "]") as unknown[];
        }

        parsedFile.unshift({ event: parsed.data, hash: parsed.data.session_id ?? null });
        await fs.writeFile(jsonPath, JSON.stringify(parsedFile, null, 2), "utf8");
        return NextResponse.json({ success: true, persisted: true }, { headers: corsHeaders });
      } catch (err) {
        console.warn("[sessions][POST] failed to write sessions.json, continuing without persistence", String(err));
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
