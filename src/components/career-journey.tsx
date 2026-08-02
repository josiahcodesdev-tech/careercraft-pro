"use client";

import { useEffect, useState } from "react";
import { Search, FileText, Users, Activity, Star, type LucideIcon } from "lucide-react";

type Step = {
  icon: LucideIcon;
  label: string;
  description: string;
};

const STEPS: Step[] = [
  { icon: Search, label: "Career assessment", description: "Discover your strengths, values and the roles that fit you best." },
  { icon: FileText, label: "CV & personal brand", description: "An ATS-ready CV and a personal brand that gets you noticed." },
  { icon: Users, label: "Interview coaching", description: "Mock interviews and storytelling frameworks so you walk in ready to win." },
  { icon: Activity, label: "Career transition", description: "A clear plan to move into your next role with confidence." },
];

// How long each step stays highlighted before advancing.
const STEP_MS = 2400;

// The card loops the "in progress" highlight down the journey — Career
// assessment, then CV & personal brand, then Interview coaching, then Career
// transition — and repeats. The progress bar, connector line and step statuses
// (Done / In progress / Up next) all follow the active step.
export function CareerJourney() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Respect reduced-motion: don't loop — leave the first step highlighted.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, []);

  const progressPct = ((active + 0.5) / STEPS.length) * 100;

  return (
    <div className="relative hidden lg:block">
      <div className="bg-card border border-border rounded-2xl p-7 shadow-xl">
        {/* Header + progress */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg font-extrabold text-brand">Your career journey</h3>
          <span className="text-[11px] font-semibold text-text-muted bg-background border border-border px-2.5 py-1 rounded-full whitespace-nowrap">
            {active} / {STEPS.length} done
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Steps */}
        <div className="flex flex-col">
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            const done = i < active;
            const isActive = i === active;
            return (
              <div key={step.label} className="flex gap-3.5">
                {/* Icon + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                      isActive ? "bg-brand" : "bg-background border border-border"
                    }`}
                  >
                    <step.icon
                      className={`w-[18px] h-[18px] transition-colors duration-500 ${
                        isActive ? "text-white" : "text-text-muted"
                      }`}
                    />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 my-1 rounded bg-border overflow-hidden">
                      {/* Green fill draws down as each step completes. */}
                      <div
                        className="w-full h-full rounded bg-brand origin-top transition-transform duration-500 ease-out motion-reduce:transition-none"
                        style={{ transform: done ? "scaleY(1)" : "scaleY(0)" }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 mb-3 rounded-lg border px-4 py-3 transition-all duration-500 ${
                    isActive ? "bg-brand-light border-brand" : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold flex-1">{step.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap transition-colors duration-500 ${
                        isActive
                          ? "bg-brand text-white"
                          : done
                          ? "bg-border text-text-muted"
                          : "bg-gold/15 text-gold"
                      }`}
                    >
                      {isActive ? "In progress" : done ? "Done" : "Up next"}
                    </span>
                  </div>
                  {/* Description expands only for the active step (grid-rows trick
                      animates the height smoothly). */}
                  <div
                    className={`grid transition-all duration-500 ease-out ${
                      isActive ? "grid-rows-[1fr] opacity-100 mt-1.5" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <p className="text-xs text-text-secondary leading-snug overflow-hidden">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating badge */}
      <div className="absolute -bottom-4 right-6 flex items-center gap-1.5 bg-gold text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg">
        <Star className="w-4 h-4 fill-current" />
        4.9 average rating
      </div>
    </div>
  );
}
