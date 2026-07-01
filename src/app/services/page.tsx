import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CtaSection } from "@/components/cta-section";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Services — MyCareerCraft",
  description:
    "Explore MyCareerCraft's career development services — career assessment, CV writing, interview coaching, personal branding, career transition, and more.",
};

const services = [
  {
    image: "/images/career-assessment.jpg",
    badge: "Assessment",
    title: "Career Assessment",
    href: "/contact",
    description:
      "Identify your strengths, values, and ideal career direction through structured assessments and expert one-on-one consultations.",
  },
  {
    image: "/images/cv-writing.jpg",
    badge: "Career",
    title: "CV & Cover Letter Writing",
    href: "/cv-builder",
    description:
      "Expert CV and cover letter crafting tailored to industry and role. Optimized for ATS and designed to stand out to hiring managers.",
  },
  {
    image: "/images/interview-coaching.jpg",
    badge: "Coaching",
    title: "Interview Coaching",
    href: "/interview-prep",
    description:
      "Mock interviews, feedback sessions, and proven frameworks to help you communicate confidently and win the room.",
  },
  {
    image: "/images/personal-branding.jpg",
    badge: "Branding",
    title: "Personal Branding",
    href: "/contact",
    description:
      "Build a compelling professional identity — from your LinkedIn presence to your elevator pitch and online portfolio.",
  },
  {
    image: "/images/career-transition.jpg",
    badge: "Transition",
    title: "Career Transition",
    href: "/contact",
    description:
      "Changing industries or roles? We create a strategic roadmap, close skill gaps, and position you for a seamless move.",
  },
  {
    image: "/images/proposals-grants.jpg",
    badge: "Writing",
    title: "Proposal Writing & Grants",
    href: "/proposals",
    description:
      "Professional proposal and grant writing services for NGOs, businesses, and individuals. Crafting compelling documents that win funding.",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Page hero */}
      <section className="bg-brand-dark text-white py-8 px-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-light/70 mb-3">
            Our services
          </p>
          <h1 className="font-heading text-[clamp(26px,3.2vw,40px)] font-black tracking-tight leading-tight mb-4">
            Comprehensive career
            <br />
            development services
          </h1>
          <p className="text-white/60 max-w-[540px] mx-auto leading-relaxed">
            From your first career move to your next big leap — we provide the
            tools, strategy, and expert support to get you there.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-20 px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {services.map((service) => (
              <div
                key={service.title}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-gray-300 transition-all duration-300"
              >
                <div className="relative w-full h-[220px] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-gold text-white text-[11px] font-bold px-3.5 py-1.5 rounded uppercase tracking-widest shadow-sm">
                    {service.badge}
                  </span>
                </div>
                <div className="px-7 pt-7 pb-6 flex flex-col flex-1">
                  <h3 className="font-heading text-[20px] font-extrabold tracking-tight text-foreground mb-3 leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-[15px] text-text-secondary leading-[1.75] flex-1 mb-6">
                    {service.description}
                  </p>
                  <Link
                    href={service.href}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-gold hover:gap-3 transition-all duration-200"
                  >
                    Explore <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing note */}
          <div className="bg-card border border-border rounded-2xl p-10 text-center mt-12">
            <h3 className="font-heading text-[22px] font-black tracking-tight mb-3">
              Every project is different
            </h3>
            <p className="text-[15px] text-text-secondary leading-relaxed max-w-[500px] mx-auto mb-6">
              We tailor our pricing to the scope of your needs. Reach out for a
              free consultation and we&apos;ll provide a clear, upfront quote —
              no surprises.
            </p>
            <Link
              href="/contact"
              className={cn(buttonVariants(), "bg-brand hover:bg-brand-mid text-white")}
            >
              Get a free quote →
            </Link>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
