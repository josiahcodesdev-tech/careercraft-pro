import { Suspense } from "react";
import { CvTransformForm } from "@/components/cv-transform-form";

export default function AdminTransformCvPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <Suspense>
        <CvTransformForm skipPayment />
      </Suspense>
    </div>
  );
}
