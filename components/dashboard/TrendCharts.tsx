"use client";


import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

type TrendChartsProps = {
  sessions: { id: number; hash?: string; reaction_time: number; violated: boolean; date: string }[];
};

const formatDateLabel = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.valueOf())) {
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  return value;
};

export function TrendCharts({ sessions }: TrendChartsProps) {
  if (!sessions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        Waiting for session data...
      </div>
    );
  }

  const chartData = sessions
    .map((session) => ({
      date: session.date,
      dateLabel: formatDateLabel(session.date),
      reaction_time: session.reaction_time,
      violated: session.violated ? 1 : 0,
    }))
    .reverse(); // chronological order

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-4">
          <p className="text-sm font-medium text-[#06b6d4]">Trust Signals</p>
          <h3 className="text-xl font-semibold text-[#0f172a]">Reaction Time (Area)</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="reactionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1faff" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="reaction_time"
                stroke="#0f172a"
                strokeWidth={2}
                fill="url(#reactionGradient)"
                dot={{ r: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-[#ef4444]">Violations</p>
          <h3 className="text-xl font-semibold text-[#0f172a]">Violation Events (Mini-bar)</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fff5f5" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="violated" maxBarSize={18}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.violated ? "#ef4444" : "#e6e6e6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#06b6d4]">Overview</p>
            <h3 className="text-xl font-semibold text-[#0f172a]">Reaction Time Snapshot</h3>
          </div>
          <span className="text-sm text-slate-500">Area shows median trend — bars show violation frequency.</span>
        </div>
        <div className="h-56 flex items-center justify-center text-slate-500">Area + mini-bar view highlights reaction-time trends and violation occurrences.</div>
      </div>
    </div>
  );
}


