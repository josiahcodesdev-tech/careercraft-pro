import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ServiceCarousel } from "@/components/service-carousel";
import { CareerJourney } from "@/components/career-journey";
import { CtaSection } from "@/components/cta-section";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/site-config";
import { Zap } from "lucide-react";

const homeTitle = "MyCareerCraft — Career Development & Professional Growth";
const homeDescription =
  "Land the job you actually want. AI-personalised interview prep, ATS-ready CV writing, and career coaching for professionals in Kenya and beyond.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "/",
    siteName: "MyCareerCraft",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MyCareerCraft",
  url: SITE_URL,
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-border/60"
          style={{
            backgroundImage: "radial-gradient(currentColor 1.1px, transparent 1.1px)",
            backgroundSize: "22px 22px",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 32% 22%, #000 8%, transparent 68%)",
            maskImage: "radial-gradient(ellipse 80% 70% at 32% 22%, #000 8%, transparent 68%)",
          }}
        />
        <div className="relative max-w-[1100px] mx-auto px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-brand-light text-brand text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Career development experts
            </span>
            <h1 className="font-heading text-[clamp(34px,4.5vw,52px)] font-black leading-[1.15] tracking-tight mb-5">
              Shape the career
              <br />
              you{" "}
              <span className="relative inline-block text-brand">
                deserve
                <svg
                  aria-hidden
                  viewBox="0 0 220 14"
                  preserveAspectRatio="none"
                  fill="none"
                  className="absolute -bottom-1.5 left-0 w-full h-[0.4em] text-gold"
                >
                  <path
                    d="M4 9 Q 70 3 110 6 T 216 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
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
                className={cn(buttonVariants(), "bg-gold hover:bg-gold/90 text-white")}
              >
                Interview Preparation
              </Link>
            </div>
            <Link
              href="/cv-transform"
              className="inline-flex items-center gap-3 bg-brand-light border border-brand/20 hover:border-brand/50 hover:bg-brand/10 rounded-xl px-4 py-3 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand leading-tight">Transform your CV to ATS friendly</p>
                <p className="text-xs text-text-muted leading-tight mt-0.5">Upload your CV · AI rewrites it · Download instantly</p>
              </div>
              <span className="text-brand text-sm font-bold ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          {/* Hero visual — animated career-journey card */}
          <CareerJourney />
        </div>
        </div>
      </section>

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

      {/* Testimonials */}
      <section className="py-20 px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-3">
              Testimonials
            </p>
            <h2 className="font-heading text-[clamp(26px,3.2vw,40px)] font-black tracking-tight leading-tight">
              What Clients Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                quote:
                  "I'd been applying for months with zero callbacks. After CareerCraft rewrote my CV, I had three interview calls within two weeks. The ATS formatting made all the difference.",
                initials: "JK",
                name: "James K.",
                role: "Software Engineer, Nairobi",
              },
              {
                quote:
                  "His proposal won us a KES 2M contract. Professional, compelling, delivered ahead of schedule.",
                initials: "DM",
                name: "David M.",
                role: "NGO Director, Mombasa",
              },
              {
                quote:
                  "My new CV landed 3 interviews in one week. Outstanding work — genuinely impressed.",
                initials: "AO",
                name: "Amina O.",
                role: "Graduate, Nairobi",
              },
            ].map((t) => (
              <div
                key={t.initials}
                className="bg-card border border-border rounded-2xl p-7"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-gold/30 mb-4"
                  fill="currentColor"
                >
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5 3.871 3.871 0 01-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5 3.871 3.871 0 01-2.748-1.179z" />
                </svg>
                <p className="text-[15px] text-foreground leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B2838] text-white flex items-center justify-center text-xs font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
