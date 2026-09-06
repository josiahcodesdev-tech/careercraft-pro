import { NextRequest, NextResponse } from "next/server";
import { findJobs, searchTerms } from "@/lib/job-finder";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Protected by the /api/admin/:path* session matcher in proxy.ts.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const location = request.nextUrl.searchParams.get("location")?.trim() ?? "";
  if (query.length > 300 || location.length > 80 || !searchTerms(query).length) {
    return NextResponse.json({ error: "Enter roles or skills separated by commas (up to 300 characters)." }, { status: 400 });
  }
  if (!checkRateLimit(`job-finder:${getClientIp(request)}`, 5, 5 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Please wait a few minutes before searching again." }, { status: 429 });
  }
  try {
    return NextResponse.json(await findJobs(query, location), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not check job sources. Please try again." }, { status: 502 });
  }
}
