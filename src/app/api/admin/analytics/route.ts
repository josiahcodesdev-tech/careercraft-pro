import { NextResponse } from "next/server";
import { listCvEvents, listInterviewEvents } from "@/lib/analytics";

export async function GET() {
  const [cvDownloads, interviewPreps] = await Promise.all([
    listCvEvents().catch(() => []),
    listInterviewEvents().catch(() => []),
  ]);

  return NextResponse.json({
    cvDownloads,
    interviewPreps,
    enquiries: [],
    proposals: [],
  });
}
