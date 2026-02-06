"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  Area,
  ComposedChart,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

type TrendChartsProps = {
  sessions: { id: number; hash?: string | null; reaction_time: number; violated: boolean; date: string }[];
};

const PRIMARY = "#06b6d4"; // teal
const VIOLATION = "#ef4444"; // red

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

function quantiles(nums: number[]) {
  if (!nums.length) return { min: 0, q1: 0, med: 0, q3: 0, max: 0 };
  const a = [...nums].sort((x, y) => x - y);
  const q = (p: number) => {
    const pos = (a.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (a[base + 1] !== undefined) return a[base] + rest * (a[base + 1] - a[base]);
    return a[base];
  };
  return { min: a[0], q1: q(0.25), med: q(0.5), q3: q(0.75), max: a[a.length - 1] };
}

function kernelDensity(xs: number[], values: number[], bandwidth = 1) {
  // gaussian KDE
  const kernel = (x: number) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  return xs.map((x) => {
    const s = values.reduce((acc, v) => acc + kernel((x - v) / bandwidth), 0);
    return s / (values.length * bandwidth);
  });
}

export function TrendCharts({ sessions }: TrendChartsProps) {
  // Hooks and computations must run unconditionally (React rules)
  const ordered = useMemo(() => [...sessions].reverse(), [sessions]);
  const reactionTimes = useMemo(() => ordered.map((s) => Number(s.reaction_time)).filter(Number.isFinite), [ordered]);
  const box = useMemo(() => quantiles(reactionTimes), [reactionTimes]);
  const aggregated = useMemo(() => {
    const m = new Map<string, { sum: number; cnt: number; viol: number }>();
    for (const s of ordered) {
      const label = formatDateLabel(s.date);
      const cur = m.get(label) ?? { sum: 0, cnt: 0, viol: 0 };
      cur.sum += Number(s.reaction_time) || 0;
      cur.cnt += 1;
      cur.viol += s.violated ? 1 : 0;
      m.set(label, cur);
    }
    return Array.from(m.entries()).map(([dateLabel, v]) => ({ dateLabel, avg: v.cnt ? v.sum / v.cnt : 0, viol: v.viol }));
  }, [ordered]);

  const violin = useMemo(() => {
    if (!reactionTimes.length) return { xs: [], density: [] };
    const min = Math.min(...reactionTimes);
    const max = Math.max(...reactionTimes);
    const xs = Array.from({ length: 40 }, (_, i) => min + ((max - min) * i) / 39);
    const mean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const std = Math.sqrt(reactionTimes.reduce((s, v) => s + (v - mean) ** 2, 0) / reactionTimes.length) || 1;
    const bw = 1.06 * std * Math.pow(reactionTimes.length, -1 / 5) || (max - min) / 10 || 1;
    const density = kernelDensity(xs, reactionTimes, bw);
    const maxD = Math.max(...density);
    return { xs, density: density.map((d) => d / (maxD || 1)) };
  }, [reactionTimes]);

  const eventData = useMemo(() => ordered.map((s) => ({
    dateLabel: formatDateLabel(s.date),
    reaction_time: s.reaction_time,
    violated: s.violated,
    hash: s.hash,
  })), [ordered]);

  const [methodOpen, setMethodOpen] = useState(false);

  if (!sessions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        Waiting for session data...
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Dual axis: area for avg reaction, bar for violations per day */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#06b6d4]">Trust Signals</p>
            <h3 className="text-xl font-semibold text-[#0f172a]">Reaction Time vs Violations (Dual-axis)</h3>
          </div>
          <div className="text-sm text-slate-500">Average reaction (left) • violation count (right)</div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={aggregated}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1faff" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="avg" name="Avg Reaction (s)" stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.08} />
              <Bar yAxisId="right" dataKey="viol" name="Violations" barSize={12} fill={VIOLATION} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Event detail plots removed — not relevant for this view */}
      </div>

      {/* Mini-bar of per-event violations + area with caps colored by violation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#06b6d4]">Overview</p>
            <h3 className="text-xl font-semibold text-[#0f172a]">Reaction Time Snapshot</h3>
          </div>
          <div className="text-sm text-slate-500">Area shows per-event reaction time — points colored by violation state.</div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={eventData}>
              <defs>
                <linearGradient id="evtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f7fbfc" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="reaction_time" stroke={PRIMARY} fill="url(#evtGrad)" dot={(props: { cx?: number; cy?: number; payload?: Record<string, unknown> }) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return null;
                const violated = payload && (payload.violated === true || payload.violated === 1);
                return <circle cx={cx} cy={cy} r={5} fill={violated ? VIOLATION : PRIMARY} stroke="#fff" strokeWidth={1} />;
              }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <div className="rounded-md border border-slate-100 bg-white p-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Methodology</div>
                <div className="text-xs text-slate-500">Behavioural data summary and experimental context</div>
              </div>
              <button onClick={() => setMethodOpen((s) => !s)} className="text-sm text-[#06b6d4] underline">
                {methodOpen ? "Hide" : "Show"}
              </button>
            </div>
            {methodOpen && (
              <div className="mt-3 text-xs text-slate-600 leading-relaxed">
                The IoMT system was implemented using Unity XR and deployed on a Meta Quest headset with hand-tracking-based locomotion control. Participants navigated a virtual wheelchair through a digital twin urban intersection containing traffic signals and autonomous NPC vehicles. Each experimental session consisted of multiple traffic decision trials, during which behavioural data were recorded automatically. For each trial, reaction time, movement behaviour, traffic-rule compliance, and timestamps were logged locally in structured JSON format. Selected events were additionally hashed using SHA-256 to enable integrity verification and blockchain-ready aggregation. Reaction time is computed as the difference between entry into the decision zone and initiation of movement. Violations indicate movement during restricted signal states.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


