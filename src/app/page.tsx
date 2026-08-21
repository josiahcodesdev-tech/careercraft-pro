import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ServiceCarousel } from "@/components/service-carousel";
import { ResumePreview } from "@/components/resume-preview";
import { CtaSection } from "@/components/cta-section";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL } from "@/lib/site-config";
import { ArrowRight, BadgeCheck, Check, FileText, Sparkles, WandSparkles } from "lucide-react";

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
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-KE",
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f5f3ee]">
        <div aria-hidden className="pointer-events-none absolute inset-0 text-border/60" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "24px 24px", maskImage: "radial-gradient(ellipse 65% 65% at 25% 35%, #000 4%, transparent 72%)" }} />
        <div className="relative mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-20 md:py-8 lg:py-6 2xl:max-w-[1620px] 2xl:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:items-start lg:gap-16 2xl:grid-cols-[1.08fr_.92fr] 2xl:gap-24">
            <div className="max-w-[650px] 2xl:max-w-[790px]">
              <span className="mb-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand lg:mb-4"><Sparkles className="h-4 w-4 text-gold" /> Kenya&apos;s career growth partner</span>
              <h1 className="mb-7 font-heading text-[clamp(52px,6vw,78px)] font-black leading-[0.98] tracking-[-0.055em] text-[#101510] lg:mb-5 2xl:text-[88px]">Build a career that opens doors.</h1>
              <p className="mb-4 max-w-[550px] text-lg leading-relaxed text-text-secondary sm:text-xl 2xl:max-w-[720px] 2xl:text-[24px]">Create an ATS-ready CV, prepare for interviews, and position yourself for the opportunities you deserve.</p>
              <div className="mb-9 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#405149] lg:mb-6 2xl:mt-6 2xl:text-base">{["Expert-guided", "ATS-friendly", "Built for you"].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" />{item}</span>)}</div>
              <div className="mb-11 flex flex-wrap gap-3">
                <Link href="/cv-builder" className={cn(buttonVariants(), "h-14 rounded-xl bg-brand px-7 text-base font-bold text-white shadow-lg shadow-brand/15 hover:bg-brand-mid")}>Build your CV <ArrowRight className="ml-1 h-4 w-4" /></Link>
                <Link href="/services" className={cn(buttonVariants({ variant: "outline" }), "h-14 rounded-xl border-brand/25 bg-transparent px-7 text-base font-bold text-brand hover:bg-brand-light")}>Explore services</Link>
              </div>
              <div className="mt-12 hidden grid-cols-3 gap-5 border-t border-brand/15 pt-7 sm:grid 2xl:mt-16 2xl:gap-8">
                {[
                  { number: "01", icon: FileText, title: "Add your details", text: "Start fresh or bring your current CV." },
                  { number: "02", icon: WandSparkles, title: "Shape your story", text: "Turn your experience into clear impact." },
                  { number: "03", icon: BadgeCheck, title: "Apply confidently", text: "Download an ATS-ready professional CV." },
                ].map((step) => (
                  <div key={step.number}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-sm shadow-brand/20">
                        <step.icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-black tracking-[0.16em] text-gold">{step.number}</span>
                    </div>
                    <h2 className="mt-2 font-heading text-lg font-extrabold text-[#173f31]">{step.title}</h2>
                    <p className="mt-2 max-w-[190px] text-sm leading-relaxed text-text-secondary">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 lg:mt-0">
              <ResumePreview />
            </div>
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
