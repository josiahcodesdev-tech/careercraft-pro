import type { Metadata } from "next";
import { CvTransformForm } from "@/components/cv-transform-form";
import { RequireService } from "@/components/require-service";

export const metadata: Metadata = {
  title: "Transform Your CV to ATS — MyCareerCraft",
  description:
    "Upload your existing CV and we'll scan, extract, and reformat it into a clean ATS-friendly layout using our professional templates.",
};

export default function CvTransformPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <RequireService serviceId="cv-transform">
        <CvTransformForm />
      </RequireService>
    </div>
  );
}
