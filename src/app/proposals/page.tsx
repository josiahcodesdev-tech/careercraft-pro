import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposal Writing & Grants — CareerCraft Pro",
  description:
    "Compelling, data-backed proposals and grant applications that win funding. We craft grant proposals, project proposals, business pitches, and funding applications.",
};

const services = [
  {
    title: "Grant Proposals",
    description:
      "Compelling grant applications tailored to specific funders and their evaluation criteria.",
  },
  {
    title: "Project Proposals",
    description:
      "Structured project proposals with clear objectives, timelines, and budget breakdowns.",
  },
  {
    title: "Business Pitches",
    description:
      "Persuasive pitch documents designed to win contracts and partnerships.",
  },
  {
    title: "Funding Applications",
    description:
      "Complete funding application packages including narratives, budgets, and supporting documents.",
  },
  {
    title: "Research & Strategy",
    description:
      "Thorough research to align your proposal with funder priorities and market opportunities.",
  },
  {
    title: "Review & Editing",
    description:
      "Professional editing and quality assurance for existing proposals and documents.",
  },
];

const steps = [
  {
    number: "01",
    title: "Free Consultation",
    description:
      "We review the opportunity and discuss your objectives and competitive advantage.",
  },
  {
    number: "02",
    title: "Research & Drafting",
    description:
      "We research the funder, develop the narrative, and draft the full proposal.",
  },
  {
    number: "03",
    title: "Review & Submission",
    description:
      "You review the final draft, we incorporate feedback, and prepare it for submission.",
  },
];

const audiences = [
  "NGOs seeking grant funding for programs",
  "Businesses bidding on contracts and tenders",
  "Startups applying for investor funding",
  "Individuals applying for scholarships or fellowships",
];

export default function ProposalsPage() {
  return (
    <>
      {/* Dark hero banner */}
      <section className="bg-brand-dark text-white py-14 px-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <h1 className="font-heading text-[clamp(28px,3.5vw,44px)] font-black tracking-tight leading-tight mb-3">
            Proposal Writing & Grants
          </h1>
          <p className="text-white/60 max-w-[480px] mx-auto leading-relaxed">
            Documents that make decision-makers say yes
          </p>
        </div>
      </section>

      {/* What we do — image + text */}
      <section className="py-16 px-8">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative h-[380px] rounded-2xl overflow-hidden">
            <Image
              src="/images/proposals-grants.jpg"
              alt="Proposal writing"
              fill
              className="object-cover"
            />
          </div>

          {/* Text */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-3">
              What We Do
            </p>
            <h2 className="font-heading text-[clamp(24px,3vw,36px)] font-black tracking-tight leading-tight mb-5">
              Proposal Writing & Grants,
              <br />
              Personalised to You
            </h2>
            <p className="text-text-secondary leading-relaxed mb-8">
              Winning proposals require more than good writing — they need
              strategy, structure, and a deep understanding of what funders and
              decision-makers look for. We craft compelling, data-backed
              proposals tailored to each opportunity. From grant applications and
              project proposals to business pitches and funding requests, every
              document is designed to make your case impossible to ignore.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className={cn(
                  buttonVariants(),
                  "bg-gold hover:bg-gold/90 text-white"
                )}
              >
                Book a Free Consultation
              </Link>
              <Link
                href="/services"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-foreground/20"
                )}
              >
                All Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="bg-background py-16 px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-3">
              What&apos;s Included
            </p>
            <h2 className="font-heading text-[clamp(24px,3vw,36px)] font-black tracking-tight leading-tight mb-3">
              Everything You Need to Succeed
            </h2>
            <p className="text-text-secondary max-w-[520px] mx-auto leading-relaxed">
              All sessions and deliverables are tailored to your specific needs,
              goals, and timeline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-card rounded-2xl p-7 border border-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-5">
                  <CheckCircle className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-heading text-base font-extrabold tracking-tight mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for + Process — dark section */}
      <section className="bg-brand-dark text-white py-16 px-8">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16">
          {/* Who it's for */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-3">
              Who It&apos;s For
            </p>
            <h2 className="font-heading text-[clamp(22px,2.5vw,32px)] font-black tracking-tight leading-tight mb-4">
              Built for People Who Want More
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Our Proposal Writing & Grants service is designed for clients at
              any stage who want to raise their standards, develop stronger
              outcomes, or get targeted support for a specific challenge.
            </p>
            <ul className="space-y-3">
              {audiences.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-white/80"
                >
                  <ArrowRight className="w-4 h-4 text-gold flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Process */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-3">
              How It Works
            </p>
            <h2 className="font-heading text-[clamp(22px,2.5vw,32px)] font-black tracking-tight leading-tight mb-6">
              Our Process
            </h2>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="w-11 h-11 rounded-full bg-gold text-white font-heading text-sm font-black flex items-center justify-center flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-extrabold tracking-tight mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner with background image */}
      <section className="relative text-white py-20 px-8 overflow-hidden">
        <Image
          src="/images/proposals-grants.jpg"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#1B2838]/80" />
        <div className="relative max-w-[700px] mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gold mb-4">
            Take the Next Step
          </p>
          <h2 className="font-heading text-[clamp(26px,3.5vw,42px)] font-black tracking-tight leading-tight mb-4">
            Ready to Get Started
            <br />
            with Proposal Writing & Grants?
          </h2>
          <p className="text-white/60 max-w-[480px] mx-auto leading-relaxed mb-8">
            Book a free consultation and take the next step towards professional
            success and confidence.
          </p>
          <Link
            href="/contact"
            className={cn(
              buttonVariants(),
              "bg-gold hover:bg-gold/90 text-white font-semibold px-8"
            )}
          >
            Book Your Free Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
