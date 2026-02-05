"use client";

import type { Session } from "@/lib/sessions";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

type TrendChartsProps = {
  sessions: Session[];
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

const getDifferenceColor = (difference: number) => {
  const intensity = Math.min(1, Math.abs(difference) / 100);
  if (difference >= 0) {
    return `rgba(5, 150, 105, ${0.2 + intensity * 0.8})`;
  }
  return `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`;
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
      smoothness: session.smoothness,
      final_score: session.final_score,
      difference: session.left_smoothness - session.right_smoothness,
    }))
    .reverse(); // chronological order for lines

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-4">
          <p className="text-sm font-medium text-teal-600">Motor Control</p>
          <h3 className="text-xl font-semibold text-slate-900">
            Smoothness Over Time
          </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="smoothness"
                stroke="#0e7490"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-blue-600">Performance</p>
          <h3 className="text-xl font-semibold text-slate-900">
            Final Score Progression
          </h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="final_score"
                stroke="#1d4ed8"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-rose-600">Bilateral Balance</p>
            <h3 className="text-xl font-semibold text-slate-900">
              Left vs Right Heatmap
            </h3>
          </div>
          <span className="text-sm text-slate-500">
            Positive = stronger left | Negative = stronger right
          </span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="difference">
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.date}`}
                    fill={getDifferenceColor(entry.difference)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


