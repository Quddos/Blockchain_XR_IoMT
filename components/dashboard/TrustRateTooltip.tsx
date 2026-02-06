"use client";

import React, { useState } from "react";

export function TrustRateTooltip({ thresholdMs }: { thresholdMs: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1">
      <span className="text-xs uppercase tracking-wide text-[#ef4444]">
        Violations tracked
      </span>
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ecfeff] border border-[#06b6d4] text-[#06b6d4] hover:bg-[#cffafe] cursor-pointer transition-colors"
        aria-label="Trust Rate information"
      >
        <span className="text-xs font-bold">?</span>
        
        {isOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
            <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
              Violations = flagged sessions OR reaction time &gt; {thresholdMs}ms
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
