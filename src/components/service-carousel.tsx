import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const services = [
  {
    image: "/images/career-assessment.jpg",
    badge: "Development",
    title: "Web Design",
    href: "/services",
    description:
      "End-to-end design and development of professional websites tailored to business needs. Includes responsive layouts, UI/UX design, and modern technology stacks.",
  },
  {
    image: "/images/proposals-grants.jpg",
    badge: "Writing",
    title: "Proposal Writing & Grants",
    href: "/services",
    description:
      "Professional proposal and grant writing services for NGOs, businesses, and individuals. Crafting compelling, well-researched documents that win funding.",
  },
  {
    image: "/images/cv-writing.jpg",
    badge: "Career",
    title: "CV & Cover Letter Writing",
    href: "/cv-builder",
    description:
      "Expert CV and cover letter crafting tailored to industry and role. Optimized for ATS and designed to stand out to hiring managers.",
  },
];

export function ServiceCarousel() {
  return (
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
  );
}
