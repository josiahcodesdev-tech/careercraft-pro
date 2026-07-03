import { NextRequest, NextResponse } from "next/server";

// PayHero posts payment results here after STK push completes.
// The client polls /api/payhero/status directly so this endpoint only
// needs to acknowledge receipt — no DB write required.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[PayHero callback]", JSON.stringify(body));
  } catch {
    // ignore malformed body
  }
  return NextResponse.json({ success: true });
}
