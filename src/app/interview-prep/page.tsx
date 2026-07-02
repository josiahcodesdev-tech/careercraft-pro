import type { Metadata } from "next";
import { InterviewPrepForm } from "@/components/interview-prep-form";

export const metadata: Metadata = {
  title: "Interview Preparation — MyCareerCraft",
  description:
    "Prepare for your next job interview with a personalised AI mock interview.",
};

export default function InterviewPrepPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <InterviewPrepForm />
    </div>
  );
}
