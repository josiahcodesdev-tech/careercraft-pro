import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { extractPayheroFields, recordPaymentStatus } from "@/lib/payhero";

function isValidCallbackToken(req: NextRequest): boolean {
  const expected = process.env.PAYHERO_CALLBACK_SECRET;
  if (!expected) return false;
  const provided = req.nextUrl.searchParams.get("token") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// PayHero posts payment results here the moment an STK push resolves —
// almost always faster than the client's next poll tick. Recording it
// immediately lets /api/payhero/status answer from our own DB instead of
// calling PayHero's API again, so confirmation lands sooner.
//
// The `token` query param is a secret we embed in the callback_url ourselves
// (see stk-push/route.ts) — without checking it, anyone could POST a fake
// "payment succeeded" body here and unlock a free download.
export async function POST(req: NextRequest) {
  if (!isValidCallbackToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
