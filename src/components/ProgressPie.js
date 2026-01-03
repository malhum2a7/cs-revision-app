import React from "react";

export default function ProgressPie({
  completed,
  total,
  // Bigger by default (was 28)
  size = 44,
  stroke = "var(--accent)",
  track = "rgba(148,163,184,0.35)",
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Scale everything based on size.
  // We keep a constant viewBox and compute r/stroke for it.
  const view = 40;
  const strokeW = Math.max(3, Math.round(size / 14)); // ~3 at 44, ~4 at 56
  const r = (view / 2) - strokeW - 1; // padding so it never clips

  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  // Center label size scales with component
  const fontSize = Math.max(10, Math.round(size / 4.2)); // ~10–14ish
  const lineHeight = 1;

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg viewBox={`0 0 ${view} ${view}`} className="w-full h-full">
        <circle
          cx={view / 2}
          cy={view / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={strokeW}
        />
        <circle
          cx={view / 2}
          cy={view / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${view / 2} ${view / 2})`}
        />
      </svg>

      <div
        className="absolute inset-0 flex items-center justify-center font-semibold"
        style={{ fontSize, lineHeight }}
      >
        {pct}%
      </div>
    </div>
  );
}
