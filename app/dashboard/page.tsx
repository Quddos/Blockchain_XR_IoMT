import type { Metadata } from "next";
import { TrendCharts } from "@/components/dashboard/TrendCharts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trust‑Aware Blockchain‑XR | Dashboard",
  description:
    "Dashboard for the Trust-Aware Blockchain-XR framework: shows reaction time, violation flags and trusts signals from IoMT sessions.",
};

const formatNumber = (value: number, digits = 1) =>
  Number.isFinite(value) ? value.toFixed(digits) : "0.0";

const formatDate = (raw: string) => {
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.valueOf())) {
    return parsed.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  return raw;
};

export default async function DashboardPage() {
  // Load sessions: prefer server-side direct file read (fast & reliable), fallback to API fetch
  let payload: { sessions?: unknown[] } = { sessions: [] };
  try {
    // Try to read directly from the bundled public JSON file (server-side)
    const fs = await import("fs/promises");
    const path = await import("path");
    const jsonPath = path.join(process.cwd(), "public", "sessions.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    try {
      payload.sessions = JSON.parse(raw) as unknown[];
    } catch {
      const normalized = raw.replace(/}\s*{/g, "},\n{");
      payload.sessions = JSON.parse("[" + normalized + "]") as unknown[];
    }
  } catch (err) {
    // If reading from disk fails (serverless/platform restrictions), fall back to fetching the API endpoint
    console.warn("[dashboard] failed to read sessions.json from disk, falling back to HTTP fetch:", String(err));
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT ?? 3000}`);
      const fetchUrl = new URL("/api/sessions", baseUrl).toString();
      const res = await fetch(fetchUrl, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        payload.sessions = json.sessions ?? [];
      } else {
        console.warn("[dashboard] fetch /api/sessions returned", res.status);
      }
    } catch (err2) {
      console.error("[dashboard] failed to fetch sessions as a fallback:", err2);
    }
  }

  const sessions: { id: number; hash?: string; reaction_time: number; violated: boolean; date: string }[] =
    (payload.sessions as any[]) || [];

  const averageReaction =
    sessions.reduce((sum, s) => sum + (s.reaction_time || 0), 0) / (sessions.length || 1);

  const violationsCount = sessions.reduce((sum, s) => sum + (s.violated ? 1 : 0), 0);

  const trustRate = ((sessions.length - violationsCount) / (sessions.length || 1)) * 100;

  const latestSessions = sessions.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#06b6d4]">
              Trust‑Aware Blockchain‑XR
            </p>
            <h1 className="text-3xl font-bold text-[#0f172a]">
              Adaptive IoMT Rehabilitation Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Reaction time and trust signals derived from XR rehabilitation sessions.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <div className="rounded-full bg-white px-5 py-2 text-sm font-medium text-[#0f172a] shadow-sm">
              {sessions.length} total sessions
            </div>
            <div className="rounded-full bg-[#e6fffb] px-3 py-1 text-xs font-medium text-[#0f172a] border border-[#06b6d4]">
              Data Source: public/sessions.json
            </div>
          </div>
        </header>

        <section className="mb-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Avg Reaction Time (s)
            </p>
            <p className="mt-2 text-4xl font-semibold text-[#0f172a]">
              {formatNumber(averageReaction)}
            </p>
            <span className="text-xs uppercase tracking-wide text-[#06b6d4]">
              Lower is better
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Trust Rate</p>
            <p className="mt-2 text-4xl font-semibold text-[#0f172a]">
              {formatNumber(trustRate, 0)}%
            </p>
            <span className="text-xs uppercase tracking-wide text-[#ef4444]">
              Violations: {violationsCount}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Session Count
            </p>
            <p className="mt-2 text-4xl font-semibold text-[#0f172a]">
              {sessions.length}
            </p>
            <span className="text-xs uppercase tracking-wide text-[#06b6d4]">
              From public sessions.json
            </span>
          </div>
        </section>

        <section className="mb-10">
          <TrendCharts sessions={sessions} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Recent Sessions
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Clinician view
              </h2>
            </div>
            <span className="text-sm text-slate-500">
              Showing last {latestSessions.length} sessions
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Block Hash</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Reaction (s)</th>
                  <th className="px-4 py-3">Violation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {latestSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {session.hash || "-"}
                    </td>
                    <td className="px-4 py-3">{formatDate(session.date)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatNumber(session.reaction_time)}
                    </td>
                    <td className="px-4 py-3">
                      {session.violated ? (
                        <span className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-medium text-[#ef4444]">
                          Violation
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#ecfeff] px-3 py-1 text-xs font-medium text-[#06b6d4]">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {!latestSessions.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      No sessions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}


