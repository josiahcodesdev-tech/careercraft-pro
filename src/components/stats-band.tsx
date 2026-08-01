"use client";

import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";

// Honest, verifiable product facts — not fabricated success metrics.
// 9 = CV builder template count; 4 = career services; 3 = transform steps
// (upload · AI rewrite · download).
const STATS = [
  { value: 9, label: "ATS-ready CV templates" },
  { value: 4, label: "Career services" },
  { value: 3, label: "Steps to transform your CV" },
];

export function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);
  // Numbers start at 0 and roll up to their real value once the band scrolls
  // into view (NumberFlow animates the digit transition).
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-3 gap-4 sm:gap-8 rounded-2xl border border-border bg-card px-6 py-8 sm:px-10"
    >
      {STATS.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="font-heading text-[clamp(30px,5vw,46px)] font-black text-brand leading-none">
            <NumberFlow value={inView ? stat.value : 0} />
          </div>
          <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-snug">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
