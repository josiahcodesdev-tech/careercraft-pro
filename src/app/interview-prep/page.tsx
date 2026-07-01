import type { Metadata } from "next";
import { InterviewPrepForm } from "@/components/interview-prep-form";
import { RequireService } from "@/components/require-service";

export const metadata: Metadata = {
  title: "Interview Preparation — MyCareerCraft",
  description:
    "Prepare for your next job interview. Paste a job description and get a personalised interview dialogue with anticipated questions and model answers.",
};

export default function InterviewPrepPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <RequireService serviceId="interview-prep">
        <InterviewPrepForm />
      </RequireService>
    </div>
  );
}
