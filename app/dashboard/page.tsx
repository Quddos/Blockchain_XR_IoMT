import type { Metadata } from "next";
import { TrendCharts } from "@/components/dashboard/TrendCharts";
import { TrustRateTooltip } from "@/components/dashboard/TrustRateTooltip";
import { SessionsTable } from "@/components/dashboard/SessionsTable";

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

// Calculate percentiles/quantiles
function calculateQuantiles(nums: number[]) {
  if (!nums.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  const sorted = [...nums].sort((a, b) => a - b);
  const getQuantile = (p: number) => {
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };
  return {
    min: sorted[0],
    q1: getQuantile(0.25),
    median: getQuantile(0.5),
    q3: getQuantile(0.75),
    max: sorted[sorted.length - 1],
  };
}

export default async function DashboardPage() {
  // Load sessions: prefer server-side direct file read (fast & reliable), fallback to API fetch
  const payload: { sessions?: unknown[] } = { sessions: [] };
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

// Normalize sessions so each item has top-level fields expected by the UI
  const rawSessions = (payload.sessions as unknown[]) || [];
  const sessions: { id: number; hash?: string | null; reaction_time: number; violated: boolean; date: string }[] = rawSessions.map((entry, idx) => {
    const e = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const evt = e.event && typeof e.event === "object" ? (e.event as Record<string, unknown>) : e;
    const get = (obj: Record<string, unknown>, keys: string[]) => {
      for (const k of keys) if (k in obj && obj[k] != null) return obj[k];
      return undefined;
    };

    return {
      id: (get(e, ["id"]) as number) ?? idx + 1,
      hash: (get(e, ["hash", "block_hash"]) as string) ?? null,
      reaction_time: Number(get(evt as Record<string, unknown>, ["reaction_time", "reaction"]) ?? 0),
      violated: Boolean(get(evt as Record<string, unknown>, ["violated"]) ?? false),
      date: String(get(evt as Record<string, unknown>, ["timestamp", "date", "time"]) ?? ""),
    };
  });

  const averageReaction =
    sessions.reduce((sum, s) => sum + (s.reaction_time || 0), 0) / (sessions.length || 1);

  // Configurable violation threshold (milliseconds). Read from env var `NEXT_PUBLIC_VIOLATION_THRESHOLD_MS`.
  // If unset, default to 5000 ms (5 seconds).
  const thresholdMs = Number(process.env.NEXT_PUBLIC_VIOLATION_THRESHOLD_MS ?? 5000);
  const thresholdSec = thresholdMs / 1000;

  // A session is considered a violation if either the recorded `violated` flag is true
  // or the reaction time exceeds the configured threshold.
  const violationsCount = sessions.reduce((sum, s) => {
    const byFlag = Boolean(s.violated);
    const byThreshold = Number(s.reaction_time) > thresholdSec;
    return sum + (byFlag || byThreshold ? 1 : 0);
  }, 0);

  const trustRate = ((sessions.length - violationsCount) / (sessions.length || 1)) * 100;

  // Calculate reaction time quantiles for statistics
  const reactionTimes = sessions.map(s => Number(s.reaction_time));
  const quantiles = calculateQuantiles(reactionTimes);

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

          {/* data source intentionally hidden for privacy */}
        </header>

        <section className="mb-10 grid gap-6 lg:grid-cols-12">
          {/* Avg Reaction Time Card */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full flex flex-col justify-center">
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
          </div>

          {/* Statistics Percentiles Card */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full flex flex-col justify-center">
              <p className="text-sm font-medium text-slate-500">
                Reaction Time Distribution
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Min</span>
                  <span className="font-semibold text-slate-900">{formatNumber(quantiles.min, 2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Q1 (25%)</span>
                  <span className="font-semibold text-slate-900">{formatNumber(quantiles.q1, 2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Median</span>
                  <span className="font-semibold text-slate-900">{formatNumber(quantiles.median, 2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Q3 (75%)</span>
                  <span className="font-semibold text-slate-900">{formatNumber(quantiles.q3, 2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Max</span>
                  <span className="font-semibold text-slate-900">{formatNumber(quantiles.max, 2)}s</span>
                </div>
              </div>
              <span className="text-xs uppercase tracking-wide text-[#06b6d4] mt-3">
                Statistical summary
              </span>
            </div>
          </div>

          {/* Trust Signals Chart with Violations Tooltip */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#06b6d4]">Trust Signals</p>
                  <h3 className="text-xl font-semibold text-[#0f172a]">Reaction Time vs Violations (Dual-axis)</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-500">Average reaction (left) • violation count (right)</div>
                  <TrustRateTooltip thresholdMs={thresholdMs} />
                </div>
              </div>
              <div className="h-72">
                <TrendCharts sessions={sessions} compactMode={true} />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <TrendCharts sessions={sessions} compactMode={false} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Recent Sessions
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Clinician view ({sessions.length} total)
              </h2>
            </div>
            <span className="text-sm text-slate-500">Recent activity</span>
          </div>
          <SessionsTable
            sessions={sessions}
            thresholdSec={thresholdSec}
          />
        </section>
      </div>
    </div>
  );
}


