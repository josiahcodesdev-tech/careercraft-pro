import type { Metadata } from "next";
import { CvTransformForm } from "@/components/cv-transform-form";
import { JsonLd } from "@/components/json-ld";
import { createServiceJsonLd } from "@/lib/structured-data";

const title = "Transform Your CV to ATS — MyCareerCraft";
const description =
  "Upload your existing CV and let AI convert it to a clean, ATS-friendly format tailored to a specific job description.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/cv-transform" },
  openGraph: {
    title,
    description,
    url: "/cv-transform",
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
  name: "CV Transformation to ATS Format",
  description,
  url: "/cv-transform",
  price: "50",
});

export default function CvTransformPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <JsonLd data={serviceJsonLd} />
      <CvTransformForm />
    </div>
  );
}
