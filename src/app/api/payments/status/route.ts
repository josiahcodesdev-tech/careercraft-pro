import { NextRequest, NextResponse } from "next/server";
import { getStatus } from "@/lib/payment-store";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref." }, { status: 400 });

  const entry = getStatus(ref);
  if (!entry) return NextResponse.json({ status: "pending" });

  return NextResponse.json({ status: entry.status, tier: entry.tier });
}
