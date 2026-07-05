import { NextRequest, NextResponse } from "next/server";
import { extractPayheroFields, recordPaymentStatus } from "@/lib/payhero";

// PayHero posts payment results here the moment an STK push resolves —
// almost always faster than the client's next poll tick. Recording it
// immediately lets /api/payhero/status answer from our own DB instead of
// calling PayHero's API again, so confirmation lands sooner.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
    console.log("[PayHero callback]", JSON.stringify(body));
  } catch {
    return NextResponse.json({ success: true });
  }

  try {
    const fields = extractPayheroFields(body);
    await recordPaymentStatus({ ...fields, raw: body });
  } catch (err) {
    console.error("[PayHero callback] failed to record status:", err);
  }

  return NextResponse.json({ success: true });
}
