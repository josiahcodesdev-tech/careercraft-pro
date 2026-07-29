import { NextRequest, NextResponse } from "next/server";
import { listOpportunities, getOpportunityCounts, getLastScan } from "@/lib/opportunities";
import { runOpportunityScan } from "@/lib/opportunity-scan";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Auth is handled entirely by src/proxy.ts's /api/admin/:path* matcher —
// no session check needed here, matching the rest of this codebase's
// admin API routes.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const [data, counts, lastScan] = await Promise.all([
      listOpportunities({
        status: searchParams.get("status") ?? undefined,
        category: searchParams.get("category") ?? undefined,
        source: searchParams.get("source") ?? undefined,
      }),
      getOpportunityCounts(),
      getLastScan(),
    ]);
    return NextResponse.json({ data, counts, lastScan });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load opportunities." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`opportunities-scan:${getClientIp(req)}`, 3, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many scan requests. Try again shortly." }, { status: 429 });
  }

  try {
    const summary = await runOpportunityScan();
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Scan failed." },
      { status: 500 }
    );
  }
}
