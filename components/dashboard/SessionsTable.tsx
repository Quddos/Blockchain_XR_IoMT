"use client";

import { useState } from "react";

type Session = {
  id: number;
  hash?: string | null;
  reaction_time: number;
  violated: boolean;
  date: string;
};

type SessionsTableProps = {
  sessions: Session[];
  thresholdSec: number;
};

export function SessionsTable({
  sessions,
  thresholdSec,
}: SessionsTableProps) {
  const [expandedView, setExpandedView] = useState(false);
  const displayedSessions = expandedView ? sessions : sessions.slice(0, 8);

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

  return (
    <>
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
            {displayedSessions.map((session) => (
              <tr key={session.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-xs">
                  {session.hash || "-"}
                </td>
                <td className="px-4 py-3">{formatDate(session.date)}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {formatNumber(session.reaction_time)}
                </td>
                <td className="px-4 py-3">
                  {(session.violated || session.reaction_time > thresholdSec) ? (
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
            {!displayedSessions.length && (
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
      
      {sessions.length > 8 && (
        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="rounded-lg bg-[#06b6d4] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0891b2] transition-colors"
          >
            {expandedView ? `Show Less (${sessions.slice(0, 8).length})` : `View More (${sessions.length} total)`}
          </button>
        </div>
      )}
    </>
  );
}
