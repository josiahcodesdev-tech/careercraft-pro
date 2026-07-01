import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { phone, amount, tier, userId } = await req.json();

  if (!phone || !amount || !tier) {
    return NextResponse.json({ error: "phone, amount, and tier are required." }, { status: 400 });
  }

  const username = process.env.PAYHERO_API_USERNAME;
  const password = process.env.PAYHERO_API_PASSWORD;
  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const callbackUrl = process.env.PAYHERO_CALLBACK_URL;

  if (!username || !password || !channelId) {
    return NextResponse.json({ error: "PayHero credentials not configured. Add PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD, and PAYHERO_CHANNEL_ID to your environment." }, { status: 503 });
  }

  if (!callbackUrl) {
    return NextResponse.json({ error: "PAYHERO_CALLBACK_URL is not set. Add it to your environment variables (e.g. https://your-domain.com/api/payments/callback)." }, { status: 503 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // Create a pending payment row first so we have the ID for external_reference
  const { data: payment, error: dbError } = await admin
    .from("payments")
    .insert({
      user_id: userId ?? null,
      provider: "mpesa",
      amount,
      tier,
      status: "pending",
    })
    .select("id")
    .single();

  if (dbError || !payment) {
    console.error("Payment DB insert error:", dbError);
    return NextResponse.json({ error: "Failed to create payment record." }, { status: 500 });
  }

  // PayHero expects the number without the leading '+', e.g. 254712345678
  const normalizedPhone = phone.replace(/^\+/, "");

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  let phData: unknown;
  try {
    const phRes = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount,
        phone_number: normalizedPhone,
        channel_id: Number(channelId),
        provider: "m-pesa",
        external_reference: payment.id,
        callback_url: callbackUrl,
      }),
    });

    phData = await phRes.json();

    if (!phRes.ok) {
      console.error("PayHero error:", phData);
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      const msg = (phData as Record<string, string>)?.message
        ?? (phData as Record<string, string>)?.error
        ?? `PayHero rejected the request (HTTP ${phRes.status}).`;
      return NextResponse.json({ error: msg, detail: phData }, { status: 502 });
    }
  } catch (err) {
    console.error("PayHero fetch error:", err);
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json({ error: "Could not reach PayHero. Check your internet connection." }, { status: 502 });
  }

  return NextResponse.json({ paymentId: payment.id, payhero: phData });
}
