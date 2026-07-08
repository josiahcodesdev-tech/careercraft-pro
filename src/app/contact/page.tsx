import type { Metadata } from "next";
import { ContactPageContent } from "@/components/contact-page-content";
import { JsonLd } from "@/components/json-ld";
import { createServiceJsonLd } from "@/lib/structured-data";

const title = "Contact Us — MyCareerCraft";
const description =
  "Get in touch with MyCareerCraft for CV writing, interview coaching, proposal writing, and career strategy support. We respond within a few hours.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title,
    description,
    url: "/contact",
    siteName: "MyCareerCraft",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const contactJsonLd = createServiceJsonLd({
  name: "Career Consultation",
  description,
  url: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={contactJsonLd} />
      <ContactPageContent />
    </>
  );
}
