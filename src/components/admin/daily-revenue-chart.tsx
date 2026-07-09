"use client";

import { useState } from "react";

export interface RevenueDayBucket {
  label: string;
  dateKey: string;
  cv: number;
  interview: number;
}

const SERIES = [
  { key: "cv", label: "CV Writing", color: "#008300" },
  { key: "interview", label: "Interview Coaching", color: "#2a78d6" },
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

export function DailyRevenueChart({
  days,
  range,
  onRangeChange,
}: {
  days: RevenueDayBucket[];
  range: number;
  onRangeChange: (range: number) => void;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const totals = days.map((d) => d.cv + d.interview);
  const maxRaw = Math.max(1, ...totals);
  const niceMax = niceCeil(maxRaw);
  const yTicks = 4;
  const width = 900;
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 30, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const dayWidth = plotW / Math.max(days.length, 1);
  const barWidth = Math.min(28, dayWidth * 0.55);
  const periodTotal = totals.reduce((sum, v) => sum + v, 0);

  function yFor(v: number) {
    return padding.top + plotH - (v / niceMax) * plotH;
  }

  const hasAnyData = maxRaw > 0;
  const showEveryLabel = days.length <= 14;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <h3 className="text-sm font-semibold">Daily Revenue</h3>
          <p className="text-xs text-text-muted mt-0.5">
            KES {periodTotal.toLocaleString()} over the last {range} days
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => onRangeChange(Number(e.target.value))}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-4 mb-3 mt-3">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Daily revenue">
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const v = (niceMax / yTicks) * i;
            const y = yFor(v);
            return (
              <g key={i}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e1e0d9" strokeWidth={1} />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#898781">
                  {Math.round(v).toLocaleString()}
                </text>
              </g>
            );
          })}

          {days.map((day, di) => {
            const groupX = padding.left + di * dayWidth;
            const x = groupX + (dayWidth - barWidth) / 2;
            const cvH = (day.cv / niceMax) * plotH;
            const ivH = (day.interview / niceMax) * plotH;
            const cvY = padding.top + plotH - cvH;
            const ivY = cvY - ivH;
            // Only the topmost non-zero segment gets rounded corners, so the
            // stack reads as one continuous bar rather than two boxes glued together.
            const interviewIsTop = day.interview > 0;
            const cvIsTop = !interviewIsTop && day.cv > 0;

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
                {day.cv > 0 && (
                  cvIsTop ? (
                    <path d={topRoundedRectPath(x, cvY, barWidth, cvH, 4)} fill={SERIES[0].color} opacity={hoverIdx === null || hoverIdx === di ? 1 : 0.35} style={{ transition: "opacity 120ms" }} />
                  ) : (
                    <rect x={x} y={cvY} width={barWidth} height={cvH} fill={SERIES[0].color} opacity={hoverIdx === null || hoverIdx === di ? 1 : 0.35} style={{ transition: "opacity 120ms" }} />
                  )
                )}
                {day.interview > 0 && (
                  interviewIsTop ? (
                    <path d={topRoundedRectPath(x, ivY, barWidth, ivH, 4)} fill={SERIES[1].color} opacity={hoverIdx === null || hoverIdx === di ? 1 : 0.35} style={{ transition: "opacity 120ms" }} />
                  ) : (
                    <rect x={x} y={ivY} width={barWidth} height={ivH} fill={SERIES[1].color} opacity={hoverIdx === null || hoverIdx === di ? 1 : 0.35} style={{ transition: "opacity 120ms" }} />
                  )
                )}
                {(showEveryLabel || di % Math.ceil(days.length / 10) === 0) && (
                  <text
                    x={groupX + dayWidth / 2}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#898781"
                  >
                    {day.label}
                  </text>
                )}
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
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-background/70">{s.label}:</span>
                <span className="font-semibold ml-auto">
                  KES {(s.key === "cv" ? days[hoverIdx].cv : days[hoverIdx].interview).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 pt-1 border-t border-background/20">
              <span className="text-background/70">Total:</span>
              <span className="font-semibold ml-auto">
                KES {(days[hoverIdx].cv + days[hoverIdx].interview).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {!hasAnyData && (
        <p className="text-xs text-text-muted text-center mt-2">No revenue in this period.</p>
      )}
    </div>
  );
}
