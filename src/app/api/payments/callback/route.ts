import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

// PayHero POSTs here after the M-Pesa transaction completes.
export async function POST(req: NextRequest) {
  const body = await req.json();

  // PayHero callback shape: { status, external_reference, response: { Amount, MpesaReceiptNumber, ... } }
  const { status, external_reference: paymentId, response } = body;

  if (!paymentId) {
    return NextResponse.json({ error: "Missing external_reference." }, { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const succeeded = status === "SUCCESS";

  // For time-based access tiers, calculate expiry from the tier on the payment record
  let expiresAt: string | null = null;
  if (succeeded) {
    const { data: existing } = await admin
      .from("payments")
      .select("tier")
      .eq("id", paymentId)
      .single();

    if (existing?.tier) {
      const hours: Record<string, number> = { "1hr": 1, "2hr": 2, "24hr": 24, "7day": 168, "30day": 720 };
      const h = hours[existing.tier];
      if (h) {
        const exp = new Date();
        exp.setHours(exp.getHours() + h);
        expiresAt = exp.toISOString();
      }
    }
  }

  const { error } = await admin
    .from("payments")
    .update({
      status: succeeded ? "active" : "failed",
      ...(expiresAt ? { expires_at: expiresAt } : {}),
      ...(response?.MpesaReceiptNumber ? { provider: `mpesa:${response.MpesaReceiptNumber}` } : {}),
    })
    .eq("id", paymentId);

  if (error) {
    console.error("Payment callback DB error:", error);
    return NextResponse.json({ error: "DB update failed." }, { status: 500 });
  }

  // PayHero expects a 200 to confirm receipt
  return NextResponse.json({ received: true });
}
