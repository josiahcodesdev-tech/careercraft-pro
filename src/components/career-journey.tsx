"use client";

import { useEffect, useRef, useState } from "react";
import { Search, FileText, Users, Activity, Star, type LucideIcon } from "lucide-react";

type Step = {
  icon: LucideIcon;
  label: string;
  status: "Done" | "In progress" | "Up next";
  description?: string;
};

const careerPath: Step[] = [
  { icon: Search, label: "Career assessment", status: "Done" },
  { icon: FileText, label: "CV & personal brand", status: "Done" },
  {
    icon: Users,
    label: "Interview coaching",
    status: "In progress",
    description: "Mock interviews and storytelling frameworks so you walk in ready to win.",
  },
  { icon: Activity, label: "Career transition", status: "Up next" },
];

const stepsDone = careerPath.filter((s) => s.status === "Done").length;
const progressPct = ((stepsDone + 0.5) / careerPath.length) * 100;

// The card animates its progress once when it scrolls into view: the bar fills
// from 0, the steps stagger in, and the green connector line "draws" downward.
export function CareerJourney() {
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative hidden lg:block">
      <div className="bg-card border border-border rounded-2xl p-7 shadow-xl">
        {/* Header + progress */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg font-extrabold text-brand">Your career journey</h3>
          <span className="text-[11px] font-semibold text-text-muted bg-background border border-border px-2.5 py-1 rounded-full whitespace-nowrap">
            {stepsDone} / {careerPath.length} done
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-out motion-reduce:transition-none"
            style={{ width: inView ? `${progressPct}%` : "0%", transitionDelay: "150ms" }}
          />
        </div>

        {/* Steps */}
        <div className="flex flex-col">
          {careerPath.map((step, i) => {
            const isLast = i === careerPath.length - 1;
            const done = step.status === "Done";
            const active = step.status === "In progress";
            return (
              <div
                key={step.label}
                className={`flex gap-3.5 transition-all duration-500 ease-out motion-reduce:transition-none ${
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
                style={{ transitionDelay: `${i * 130}ms` }}
              >
                {/* Icon + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? "bg-brand" : "bg-background border border-border"
                    }`}
                  >
                    <step.icon className={`w-[18px] h-[18px] ${active ? "text-white" : "text-text-muted"}`} />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 my-1 rounded bg-border overflow-hidden">
                      {(done || active) && (
                        <div
                          className="w-full h-full rounded bg-brand origin-top transition-transform duration-500 ease-out motion-reduce:transition-none"
                          style={{
                            transform: inView ? "scaleY(1)" : "scaleY(0)",
                            transitionDelay: `${i * 130 + 250}ms`,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 mb-3 rounded-lg border px-4 py-3 transition-all ${
                    active ? "bg-brand-light border-brand" : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold flex-1">{step.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${
                        active
                          ? "bg-brand text-white"
                          : done
                          ? "bg-border text-text-muted"
                          : "bg-gold/15 text-gold"
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                  {step.description && (
                    <p className="text-xs text-text-secondary leading-snug mt-1.5">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating badge */}
      <div
        className={`absolute -bottom-4 right-6 flex items-center gap-1.5 bg-gold text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg transition-all duration-500 ease-out motion-reduce:transition-none ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ transitionDelay: "700ms" }}
      >
        <Star className="w-4 h-4 fill-current" />
        4.9 average rating
      </div>
    </div>
  );
}
