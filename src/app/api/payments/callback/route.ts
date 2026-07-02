import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[PayHero] Callback received:", JSON.stringify(body));
  // Status is polled directly from PayHero's API — no local state needed.
  return NextResponse.json({ received: true });
}
