import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Clock, MapPin, Phone } from "lucide-react";

const features = [
  { icon: Mail, title: "Email us", desc: "hello@careercraft.pro" },
  { icon: Clock, title: "Response time", desc: "Within a few hours" },
  { icon: MapPin, title: "Based in", desc: "Nairobi, serving globally" },
  { icon: Phone, title: "Call us", desc: "Available on request" },
];

export function CtaSection() {
  return (
    <section className="bg-foreground text-white py-20 px-8">
      <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-light/70 mb-3">
            Start today
          </p>
          <h2 className="font-heading text-[clamp(26px,3.2vw,40px)] font-black tracking-tight leading-tight mb-4">
            Your career won&apos;t
            <br />
            wait. Neither should you.
          </h2>
          <p className="text-white/60 mb-8 max-w-[540px] leading-relaxed">
            Book a free 30-minute consultation. No obligation — just a
            conversation about where you are and where you want to go.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className={cn(buttonVariants(), "bg-white text-foreground font-semibold hover:bg-background")}
            >
              Build Your ATS-Ready CV Now →
            </Link>
            <Link
              href="/services"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-white/25 text-white/80 hover:border-white/50 hover:text-white bg-transparent"
              )}
            >
              Explore services
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/6 border border-white/10 rounded-xl p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                <f.icon className="w-[18px] h-[18px] text-white/80" />
              </div>
              <h4 className="text-sm font-semibold mb-1">{f.title}</h4>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
