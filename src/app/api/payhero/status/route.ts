import { NextRequest, NextResponse } from "next/server";
import { lookupPaymentStatus, recordPaymentStatus } from "@/lib/payhero";

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

  // PayHero's single-transaction `transaction-status?reference=` lookup only
  // accepts PayHero's own internal provider_reference (e.g. "UG55HAC8PQ"),
  // which we never receive at STK-push time — confirmed by testing directly
  // against the real API, where our own external_reference (and the
  // checkout_request_id we used to poll with) both returned NOT_FOUND for a
  // transaction that had, in fact, already succeeded. The account
  // transactions list *does* include external_reference per entry, so
  // search that instead — it's the only reference we're guaranteed to have.
  try {
    const phRes = await fetch(
      `${PAYHERO_BASE}/transactions?page=1&per_page=20`,
      { headers: { Authorization: auth }, cache: "no-store" }
    );

    const data = await phRes.json() as { transactions?: Array<Record<string, unknown>> };
    const match = (data.transactions ?? []).find(
      (t) => t.external_reference === ref && t.transaction_type === "inbound_payment"
    );
    console.log("[PayHero status]", ref, match ? "MATCHED" : "no match in recent transactions");

    const status = match ? "SUCCESS" : "PENDING";

    // Cache a terminal result so the next poll can hit the fast DB path
    // instead of calling out again. Note: this list only ever contains
    // settled (successful) transactions, so a genuinely failed/cancelled
    // payment can't be positively detected here — it still resolves via
    // the client's existing 2-minute timeout, same as before this fix.
    if (status === "SUCCESS") {
      recordPaymentStatus({ checkoutRequestId: ref, externalReference: ref, status, raw: match }).catch(() => {});
    }

    return NextResponse.json({ status, raw: match ?? null });
  } catch (err) {
    console.error("PayHero status error:", err);
    return NextResponse.json({ status: "PENDING", raw: {} });
  }
}
