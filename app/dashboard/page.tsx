import type { Metadata } from "next";
import { TrendCharts } from "@/components/dashboard/TrendCharts";
import { getSessions } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VR Stroke Rehab | Dashboard",
  description:
    "Real-time insight into Unity VR stroke rehabilitation sessions.",
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
  const sessions = await getSessions();

  const averageSmoothness =
    sessions.reduce((sum, session) => sum + session.smoothness, 0) /
    (sessions.length || 1);

  const bestScore = sessions.reduce(
    (max, session) => Math.max(max, session.final_score),
    0,
  );

  const latestSessions = sessions.slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">
              VR Stroke Rehabilitation
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Patient Progress Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Live session data from Meta Quest headsets.
            </p>
          </div>
          <div className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-600 shadow-sm">
            {sessions.length} total sessions
          </div>
        </header>

        <section className="mb-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Average Smoothness
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">
              {formatNumber(averageSmoothness)}
            </p>
            <span className="text-xs uppercase tracking-wide text-teal-600">
              Higher is better
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Best Score</p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">
              {formatNumber(bestScore)}
            </p>
            <span className="text-xs uppercase tracking-wide text-blue-600">
              Peak performance
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Session Count
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">
              {sessions.length}
            </p>
            <span className="text-xs uppercase tracking-wide text-rose-600">
              Lifetime total
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
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Smoothness</th>
                  <th className="px-4 py-3">Final Score</th>
                  <th className="px-4 py-3">Duration (s)</th>
                  <th className="px-4 py-3">Left / Right</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {latestSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {session.session_id || "N/A"}
                    </td>
                    <td className="px-4 py-3">{formatDate(session.date)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatNumber(session.smoothness)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatNumber(session.final_score)}
                    </td>
                    <td className="px-4 py-3">{formatNumber(session.duration)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-emerald-600">
                        {formatNumber(session.left_smoothness)}
                      </span>{" "}
                      /{" "}
                      <span className="font-semibold text-sky-600">
                        {formatNumber(session.right_smoothness)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!latestSessions.length && (
                  <tr>
                    <td
                      colSpan={6}
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


