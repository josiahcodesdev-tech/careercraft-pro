import { Suspense } from "react";
import type { Metadata } from "next";
import { CvBuilderForm } from "@/components/cv-builder-form";
import { RequireService } from "@/components/require-service";

export const metadata: Metadata = {
  title: "ATS-Friendly CV Builder — MyCareerCraft",
  description:
    "Create a professional, ATS-optimised CV tailored to your target role. Our builder follows industry best practices to help you pass automated screening and impress hiring managers.",
};

export default function CvBuilderPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <RequireService serviceId="cv-builder">
        <Suspense>
          <CvBuilderForm />
        </Suspense>
      </RequireService>
    </div>
  );
}
