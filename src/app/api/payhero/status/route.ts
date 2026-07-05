import { NextRequest, NextResponse } from "next/server";
import { lookupPaymentStatus, recordPaymentStatus } from "@/lib/payhero";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

function getAuth(): string {
  const u = process.env.PAYHERO_API_USERNAME;
  const p = process.env.PAYHERO_API_PASSWORD;
  if (!u || !p) throw new Error("PayHero credentials not configured.");
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
}

function extractStatus(data: Record<string, unknown>): string {
  // Only trust explicit status strings — never infer from response_code
  // (PayHero uses response_code "0" to mean "API call OK", not "payment succeeded")
  const raw =
    data.status ??
    data.Status ??
    (data.data as Record<string, unknown>)?.status ??
    (data.transaction as Record<string, unknown>)?.status ??
    data.response_status ??
    "";

  let status = String(raw).toUpperCase().trim();

  // Normalise aliases PayHero may use
  if (status === "COMPLETE" || status === "COMPLETED" || status === "SUCCESSFUL") status = "SUCCESS";
  if (status === "CANCELLED" || status === "CANCELED") status = "FAILED";

  // If the API call itself failed (network/auth error), treat as still pending
  // so we keep polling rather than silently failing
  if (!status && data.success === false) status = "FAILED";

  return status || "PENDING";
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

    const status = extractStatus(data);

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
