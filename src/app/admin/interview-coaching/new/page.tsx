import { InterviewPrepForm } from "@/components/interview-prep-form";

export default function AdminNewInterviewPrepPage() {
  return (
    <div className="-m-6 h-[calc(100vh-56px)] overflow-hidden">
      <InterviewPrepForm skipPayment />
    </div>
  );
}
