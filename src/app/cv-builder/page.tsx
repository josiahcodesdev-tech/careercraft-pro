import { Suspense } from "react";
import type { Metadata } from "next";
import { CvBuilderForm } from "@/components/cv-builder-form";
import { JsonLd } from "@/components/json-ld";
import { createServiceJsonLd } from "@/lib/structured-data";

const title = "ATS-Friendly CV Builder — MyCareerCraft";
const description =
  "Create a professional, ATS-optimised CV tailored to your target role. Choose from multiple templates and download as PDF or Word.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/cv-builder" },
  openGraph: {
    title,
    description,
    url: "/cv-builder",
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
  name: "ATS-Friendly CV Builder",
  description,
  url: "/cv-builder",
  price: "40",
});

export default function CvBuilderPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <JsonLd data={serviceJsonLd} />
      <Suspense>
        <CvBuilderForm />
      </Suspense>
    </div>
  );
}
