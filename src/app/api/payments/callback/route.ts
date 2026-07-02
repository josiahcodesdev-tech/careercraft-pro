import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

// PayHero POSTs here after the M-Pesa transaction completes.
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[PayHero] Callback received:", JSON.stringify(body));

  // PayHero sends: { status, external_reference, response: { MpesaReceiptNumber, ... } }
  const { status, external_reference: paymentId, response } = body;

  if (!paymentId) {
    return NextResponse.json({ error: "Missing external_reference." }, { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const succeeded = status === "SUCCESS";

  const { error } = await admin
    .from("payments")
    .update({
      status: succeeded ? "active" : "failed",
      ...(response?.MpesaReceiptNumber
        ? { provider: `mpesa:${response.MpesaReceiptNumber}` }
        : {}),
    })
    .eq("id", paymentId);

  if (error) {
    console.error("[Payments] Callback DB update error:", error);
    return NextResponse.json({ error: "DB update failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
