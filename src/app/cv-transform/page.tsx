import type { Metadata } from "next";
import { CvTransformForm } from "@/components/cv-transform-form";

export const metadata: Metadata = {
  title: "Transform Your CV to ATS — MyCareerCraft",
  description:
    "Upload your existing CV and convert it to a clean ATS-friendly format.",
};

export default function CvTransformPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <CvTransformForm />
    </div>
  );
}
