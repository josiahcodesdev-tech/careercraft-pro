import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ServiceCarousel } from "@/components/service-carousel";
import { CtaSection } from "@/components/cta-section";
import { Search, FileText, Users, Activity } from "lucide-react";

const trustAvatars = ["JK", "AM", "PO", "LN", "SK"];

const careerPath = [
  { icon: Search, label: "Career assessment", status: "Done", active: false },
  { icon: FileText, label: "CV & personal brand", status: "Done", active: false },
  { icon: Users, label: "Interview coaching", status: "In progress", active: true },
  { icon: Activity, label: "Career growth plan", status: "Upcoming", active: false },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <div className="max-w-[1100px] mx-auto px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-brand-light text-brand text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Career development experts
            </span>
            <h1 className="font-heading text-[clamp(34px,4.5vw,52px)] font-black leading-[1.15] tracking-tight mb-5">
              Shape the career
              <br />
              you <em className="not-italic text-brand">deserve</em>
            </h1>
            <p className="text-[17px] text-text-secondary leading-relaxed max-w-[440px] mb-8">
              We help professionals at every stage discover their strengths,
              position themselves strategically, and land the roles they truly
              want.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/cv-builder"
                className={cn(buttonVariants(), "bg-brand hover:bg-brand-mid text-white")}
              >
                Build Your ATS-Ready CV Now →
              </Link>
              <Link
                href="/interview-prep"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Interview Preparation
              </Link>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <div className="flex">
                {trustAvatars.map((initials, i) => (
                  <div
                    key={initials}
                    className="w-8 h-8 rounded-full bg-brand-light border-2 border-background flex items-center justify-center text-[11px] font-semibold text-brand"
                    style={{ marginLeft: i > 0 ? "-8px" : 0 }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span>Trusted by 500+ professionals across East Africa</span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              <h3 className="font-heading text-lg font-extrabold text-brand mb-6">
                Your career journey
              </h3>
              <div className="flex flex-col gap-4">
                {careerPath.map((step) => (
                  <div
                    key={step.label}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-lg border transition-all ${
                      step.active
                        ? "bg-brand-light border-brand"
                        : "bg-background border-border"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        step.active ? "bg-brand" : "bg-border"
                      }`}
                    >
                      <step.icon
                        className={`w-[18px] h-[18px] ${
                          step.active ? "text-white" : "text-text-muted"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium flex-1">
                      {step.label}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        step.active
                          ? "bg-brand text-white"
                          : "bg-border text-text-muted"
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-5 -right-5 bg-card border border-border rounded-xl px-4 py-3 shadow-md flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-brand" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">93% success rate</div>
                <div className="text-[11px] text-text-muted">Clients land roles within 90 days</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services carousel */}
      <section className="bg-card py-20 px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-3">
              What we do
            </p>
            <h2 className="font-heading text-[clamp(26px,3.2vw,40px)] font-black tracking-tight leading-tight mb-4">
              Everything you need to
              <br />
              advance your career
            </h2>
            <p className="text-text-secondary max-w-[540px] mx-auto leading-relaxed">
              From understanding where you are, to getting where you want to be
              — our services cover the full spectrum of career development.
            </p>
          </div>
          <ServiceCarousel />
          <div className="flex justify-center mt-8">
            <Link
              href="/services"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View all services →
            </Link>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
