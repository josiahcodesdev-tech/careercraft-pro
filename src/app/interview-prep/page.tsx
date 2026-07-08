import type { Metadata } from "next";
import { InterviewPrepForm } from "@/components/interview-prep-form";
import { JsonLd } from "@/components/json-ld";
import { createServiceJsonLd } from "@/lib/structured-data";

const title = "Interview Preparation — MyCareerCraft";
const description =
  "Prepare for your next job interview with a personalised AI mock interview — realistic questions and model answers tailored to your CV and the job description.";

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

const serviceJsonLd = createServiceJsonLd({
  name: "AI Interview Preparation",
  description,
  url: "/interview-prep",
  price: "100",
});

export default function InterviewPrepPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <JsonLd data={serviceJsonLd} />
      <InterviewPrepForm />
    </div>
  );
}
