import { z } from "zod";
import { getDbClient } from "./db";

export const sessionSchema = z.object({
  session_id: z.string().min(1, "session_id is required"),
  smoothness: z.coerce.number(),
  time_score: z.coerce.number(),
  final_score: z.coerce.number(),
  duration: z.coerce.number(),
  left_smoothness: z.coerce.number(),
  right_smoothness: z.coerce.number(),
  date: z.string().min(1, "date is required"),
});

export type SessionPayload = z.infer<typeof sessionSchema>;

export type Session = SessionPayload & {
  id: number;
};

type SessionRow = {
  id: number;
  session_id: string | null;
  smoothness: number | string | null;
  time_score: number | string | null;
  final_score: number | string | null;
  duration: number | string | null;
  left_smoothness: number | string | null;
  right_smoothness: number | string | null;
  date: string | null;
};

const toNumber = (value: number | string | null): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export async function insertSession(payload: SessionPayload) {
  const sql = getDbClient();

  await sql`
    INSERT INTO sessions (
      session_id,
      smoothness,
      time_score,
      final_score,
      duration,
      left_smoothness,
      right_smoothness,
      date
    )
    VALUES (
      ${payload.session_id},
      ${payload.smoothness},
      ${payload.time_score},
      ${payload.final_score},
      ${payload.duration},
      ${payload.left_smoothness},
      ${payload.right_smoothness},
      ${payload.date}
    );
  `;
}

export async function getSessions(): Promise<Session[]> {
  const sql = getDbClient();
  const rows = (await sql`
    SELECT
      id,
      session_id,
      smoothness,
      time_score,
      final_score,
      duration,
      left_smoothness,
      right_smoothness,
      date
    FROM sessions
    ORDER BY date DESC, id DESC;
  `) as SessionRow[];

  return rows.map((row) => ({
    id: row.id,
    session_id: row.session_id ?? "",
    smoothness: toNumber(row.smoothness),
    time_score: toNumber(row.time_score),
    final_score: toNumber(row.final_score),
    duration: toNumber(row.duration),
    left_smoothness: toNumber(row.left_smoothness),
    right_smoothness: toNumber(row.right_smoothness),
    date: row.date ?? "",
  }));
}


