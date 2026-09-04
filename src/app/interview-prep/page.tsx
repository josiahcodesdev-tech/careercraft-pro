import type { Metadata } from "next";
import { InterviewPrepForm } from "@/components/interview-prep-form";
import { InterviewPrepContent, INTERVIEW_PREP_FAQ } from "@/components/interview-prep-content";
import { JsonLd } from "@/components/json-ld";
import { createServiceJsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site-config";

// "Interview preparation" on its own is a global head term we have no business
// chasing yet; the qualified version of the query is the one worth winning.
const title = "Interview Preparation in Kenya — Mock Questions & Answers";
const description =
  "Prepare for your next job interview with a personalised mock interview: 30 questions and model answers tailored to the job description and your own CV.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/interview-prep" },
  openGraph: {
    title,
    description,
    url: "/interview-prep",
    siteName: "MyCareerCraft",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    createServiceJsonLd({
      name: "AI Interview Preparation",
      description,
      url: "/interview-prep",
      price: "100",
    }),
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Interview Preparation", item: `${SITE_URL}/interview-prep` },
      ],
    },
    {
      // Mirrors the FAQ rendered on the page — Google requires the answer it
      // shows to be visible to the reader too, so the two share one source.
      "@type": "FAQPage",
      mainEntity: INTERVIEW_PREP_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function InterviewPrepPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="flex h-[calc(100dvh-5rem)] flex-col 2xl:h-[calc(100dvh-7rem)]">
        <InterviewPrepForm />
      </div>
      <InterviewPrepContent />
    </>
  );
}
