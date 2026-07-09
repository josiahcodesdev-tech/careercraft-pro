import { NextResponse } from "next/server";
import { listCvEvents, listInterviewEvents } from "@/lib/analytics";

export async function GET() {
  const [cvDownloads, interviewPreps] = await Promise.all([
    listCvEvents().catch((e) => {
      console.error("[admin analytics] listCvEvents failed:", e instanceof Error ? e.message : e);
      return [];
    }),
    listInterviewEvents().catch((e) => {
      console.error("[admin analytics] listInterviewEvents failed:", e instanceof Error ? e.message : e);
      return [];
    }),
  ]);

  return NextResponse.json({
    cvDownloads,
    interviewPreps,
    enquiries: [],
    proposals: [],
  });
}
