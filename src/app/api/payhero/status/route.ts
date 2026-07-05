import { NextRequest, NextResponse } from "next/server";
import { lookupPaymentStatus, recordPaymentStatus, derivePayheroStatus } from "@/lib/payhero";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

function getAuth(): string {
  const u = process.env.PAYHERO_API_USERNAME;
  const p = process.env.PAYHERO_API_PASSWORD;
  if (!u || !p) throw new Error("PayHero credentials not configured.");
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  // Fast path: PayHero's webhook may already have landed in our own DB —
  // a local read beats another round trip to PayHero's API.
  try {
    const cached = await lookupPaymentStatus(ref);
    if (cached === "SUCCESS" || cached === "FAILED") {
      return NextResponse.json({ status: cached, source: "webhook" });
    }
  } catch (err) {
    console.error("PayHero status: DB lookup failed, falling back to API:", err);
  }

  let auth: string;
  try {
    auth = getAuth();
  } catch {
    return NextResponse.json({ error: "Payment service not configured." }, { status: 503 });
  }

  try {
    const phRes = await fetch(
      `${PAYHERO_BASE}/transaction-status?reference=${encodeURIComponent(ref)}`,
      { headers: { Authorization: auth }, cache: "no-store" }
    );

    const data = await phRes.json() as Record<string, unknown>;
    console.log("[PayHero status]", ref, JSON.stringify(data));

    const status = derivePayheroStatus(data);

    // Cache a terminal result so the next poll (or a retry using the other
    // reference form) can hit the fast DB path instead of calling out again.
    if (status === "SUCCESS" || status === "FAILED") {
      recordPaymentStatus({ checkoutRequestId: ref, externalReference: ref, status, raw: data }).catch(() => {});
    }

    return NextResponse.json({ status, raw: data });
  } catch (err) {
    console.error("PayHero status error:", err);
    return NextResponse.json({ status: "PENDING", raw: {} });
  }
}
