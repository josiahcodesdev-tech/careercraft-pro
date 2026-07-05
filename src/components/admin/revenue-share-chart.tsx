"use client";

import { useState } from "react";

export interface RevenueSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number): string {
  const x1o = cx + rOuter * Math.cos(startAngle);
  const y1o = cy + rOuter * Math.sin(startAngle);
  const x2o = cx + rOuter * Math.cos(endAngle);
  const y2o = cy + rOuter * Math.sin(endAngle);
  const x1i = cx + rInner * Math.cos(endAngle);
  const y1i = cy + rInner * Math.sin(endAngle);
  const x2i = cx + rInner * Math.cos(startAngle);
  const y2i = cy + rInner * Math.sin(startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${x1o},${y1o} A${rOuter},${rOuter} 0 ${largeArc} 1 ${x2o},${y2o} L${x1i},${y1i} A${rInner},${rInner} 0 ${largeArc} 0 ${x2i},${y2i} Z`;
}

export function RevenueShareChart({ slices }: { slices: RevenueSlice[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 90;
  const rInner = 56;
  const gap = 0.02; // radians, surface gap between slices

  const cumulativeStarts = slices.reduce<number[]>((acc, s) => {
    const prevTotal = acc.length ? acc[acc.length - 1] : 0;
    return [...acc, prevTotal + s.value];
  }, []);

  const arcs = slices.map((s, i) => {
    const runningStart = i === 0 ? 0 : cumulativeStarts[i - 1];
    const runningEnd = cumulativeStarts[i];
    const startAngle = (runningStart / total) * 2 * Math.PI - Math.PI / 2 + (total > 0 ? gap / 2 : 0);
    const endAngle = (runningEnd / total) * 2 * Math.PI - Math.PI / 2 - (total > 0 ? gap / 2 : 0);
    return { ...s, startAngle, endAngle, idx: i };
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-4">Revenue Share by Service (est.)</h3>

      {total === 0 ? (
        <p className="text-sm text-text-muted">No revenue data yet.</p>
      ) : (
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Revenue share by service">
              {arcs.map((a) => (
                <path
                  key={a.key}
                  d={arcPath(cx, cy, rOuter, rInner, a.startAngle, a.endAngle)}
                  fill={a.color}
                  opacity={hoverIdx === null || hoverIdx === a.idx ? 1 : 0.4}
                  style={{ transition: "opacity 120ms", cursor: "pointer" }}
                  onMouseEnter={() => setHoverIdx(a.idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
              <span className="text-[10px] text-text-muted">
                {hoverIdx !== null ? slices[hoverIdx].label : "Total"}
              </span>
              <span className="text-base font-heading font-black leading-tight">
                KES {(hoverIdx !== null ? slices[hoverIdx].value : total).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2 flex-1 min-w-[160px]">
            {slices.map((s, i) => (
              <div
                key={s.key}
                className="flex items-center justify-between gap-3 text-xs cursor-pointer rounded-md px-1 -mx-1 py-0.5 transition-colors hover:bg-background"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-text-secondary">{s.label}</span>
                </div>
                <span className="font-semibold whitespace-nowrap">
                  KES {s.value.toLocaleString()}{" "}
                  <span className="text-text-muted font-normal">({Math.round((s.value / total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
