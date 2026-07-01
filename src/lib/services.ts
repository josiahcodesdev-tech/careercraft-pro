import { FileText, Users, Sparkles } from "lucide-react";

export const TOOL_SERVICES = [
  {
    id: "cv-builder",
    name: "CV Builder",
    tagline: "ATS-Friendly CV Creation",
    description:
      "Build a professional CV from scratch with 9 premium templates optimised for ATS screening.",
    href: "/cv-builder",
    price: 1500,
    icon: FileText,
  },
  {
    id: "interview-prep",
    name: "Interview Prep",
    tagline: "AI-Powered Mock Interviews",
    description:
      "Paste a job description and get a personalised mock interview with model answers.",
    href: "/interview-prep",
    price: 1000,
    icon: Users,
  },
  {
    id: "cv-transform",
    name: "CV Transform",
    tagline: "ATS Conversion Tool",
    description:
      "Upload your existing CV and convert it to a clean ATS-ready format, matched to a job description.",
    href: "/cv-transform",
    price: 800,
    icon: Sparkles,
  },
] as const;

export type ServiceId = (typeof TOOL_SERVICES)[number]["id"] | "bundle";

export const BUNDLE_PRICE = 2500;

// Total individual price so the UI can show the saving
export const INDIVIDUAL_TOTAL = TOOL_SERVICES.reduce((s, t) => s + t.price, 0);

export function hasServiceAccess(
  activePayments: { tier: string }[],
  serviceId: string
): boolean {
  return activePayments.some(
    (p) => p.tier === serviceId || p.tier === "bundle"
  );
}
