import { NextRequest, NextResponse } from "next/server";
import { runOpportunityScan } from "@/lib/opportunity-scan";

// Deliberately outside /api/admin/* — src/proxy.ts's cookie-based admin
// session gate can't be satisfied by Vercel Cron (it sends a bearer token,
// not a cookie), so this route checks CRON_SECRET itself and fails closed
// if it's unset.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runOpportunityScan();
  return NextResponse.json(summary);
}
