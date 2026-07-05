"use client";

import { useState } from "react";

export interface DayBucket {
  label: string;
  dateKey: string;
  values: number[];
}

export const ACTIVITY_SERIES = [
  { key: "cv", label: "CV Writing", color: "#008300" },
  { key: "interview", label: "Interview Coaching", color: "#2a78d6" },
  { key: "enquiry", label: "Enquiries", color: "#eda100" },
  { key: "proposal", label: "Proposals", color: "#e34948" },
] as const;

function niceCeil(n: number): number {
  if (n <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / pow;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return niceNorm * pow;
}

function topRoundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

export function WeeklyActivityChart({ days }: { days: DayBucket[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxRaw = Math.max(1, ...days.flatMap((d) => d.values));
  const niceMax = niceCeil(maxRaw);
  const yTicks = 4;
  const width = 700;
  const height = 280;
  const padding = { top: 16, right: 16, bottom: 30, left: 32 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const dayWidth = plotW / days.length;
  const barGap = 2;
  const barWidth = Math.min(20, (dayWidth - 16 - barGap * (ACTIVITY_SERIES.length - 1)) / ACTIVITY_SERIES.length);

  function yFor(v: number) {
    return padding.top + plotH - (v / niceMax) * plotH;
  }

  const hasAnyData = maxRaw > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-4">Weekly Activity by Service</h3>

      <div className="flex flex-wrap gap-4 mb-3">
        {ACTIVITY_SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Weekly activity by service">
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const v = (niceMax / yTicks) * i;
            const y = yFor(v);
            return (
              <g key={i}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e1e0d9" strokeWidth={1} />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#898781">
                  {Math.round(v)}
                </text>
              </g>
            );
          })}

          {days.map((day, di) => {
            const groupX = padding.left + di * dayWidth;
            const contentW = barWidth * ACTIVITY_SERIES.length + barGap * (ACTIVITY_SERIES.length - 1);
            const startX = groupX + (dayWidth - contentW) / 2;
            return (
              <g key={day.dateKey}>
                <rect
                  x={groupX}
                  y={padding.top}
                  width={dayWidth}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(di)}
                  onMouseLeave={() => setHoverIdx((v) => (v === di ? null : v))}
                />
                {ACTIVITY_SERIES.map((s, si) => {
                  const val = day.values[si];
                  const barH = (val / niceMax) * plotH;
                  const x = startX + si * (barWidth + barGap);
                  const y = padding.top + plotH - barH;
                  return (
                    <path
                      key={s.key}
                      d={topRoundedRectPath(x, y, barWidth, barH, 4)}
                      fill={s.color}
                      opacity={hoverIdx === null || hoverIdx === di ? 1 : 0.35}
                      style={{ transition: "opacity 120ms" }}
                    />
                  );
                })}
                <text
                  x={groupX + dayWidth / 2}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#898781"
                >
                  {day.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoverIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-foreground text-background text-xs rounded-lg px-3 py-2 shadow-lg z-10 space-y-1"
            style={{
              left: `${((hoverIdx + 0.5) / days.length) * 100}%`,
              transform: `translateX(${hoverIdx > days.length - 2 ? "-90%" : hoverIdx < 1 ? "-10%" : "-50%"})`,
            }}
          >
            <p className="font-semibold">{days[hoverIdx].label}</p>
            {ACTIVITY_SERIES.map((s, si) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-background/70">{s.label}:</span>
                <span className="font-semibold ml-auto">{days[hoverIdx].values[si]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!hasAnyData && (
        <p className="text-xs text-text-muted text-center mt-2">No activity in the last 7 days.</p>
      )}
    </div>
  );
}
