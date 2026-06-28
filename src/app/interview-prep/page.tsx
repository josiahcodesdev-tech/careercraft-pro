import type { Metadata } from "next";
import { InterviewPrepForm } from "@/components/interview-prep-form";

export const metadata: Metadata = {
  title: "Interview Preparation — CareerCraft Pro",
  description:
    "Prepare for your next job interview. Paste a job description and get a personalised interview dialogue with anticipated questions and model answers.",
};

export default function InterviewPrepPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <InterviewPrepForm />
    </div>
  );
}
