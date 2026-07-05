import { Suspense } from "react";
import { CvBuilderForm } from "@/components/cv-builder-form";

export default function AdminNewCvPage() {
  return (
    <div className="-m-6 h-[calc(100vh-56px)] overflow-hidden">
      <Suspense>
        <CvBuilderForm skipPayment />
      </Suspense>
    </div>
  );
}
