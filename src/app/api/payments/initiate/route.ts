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
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const { data: payment, error: dbError } = await admin
    .from("payments")
    .insert({ user_id: userId ?? null, provider: "mpesa", amount, tier, status: "pending" })
    .select("id")
    .single();

  if (dbError || !payment) {
    console.error("Payment DB insert error:", dbError);
    return NextResponse.json({ error: "Failed to create payment record." }, { status: 500 });
  }

  // Normalise to 07XXXXXXXX (local Kenyan format PayHero STK push expects)
  // Input arrives as e.g. "254712345678" or "+254712345678" or "0712345678"
  const digits = phone.replace(/^\+/, "").replace(/\s/g, "");
  const normalizedPhone = digits.startsWith("254")
    ? "0" + digits.slice(3)   // 254712345678 → 0712345678
    : digits.startsWith("0")
    ? digits                   // 0712345678 → 0712345678
    : "0" + digits;            // 712345678   → 0712345678

  const requestBody = {
    amount: Number(amount),
    phone_number: normalizedPhone,
    channel_id: Number(channelId),
    provider: "m-pesa",
    external_reference: payment.id,
    callback_url: callbackUrl,
  };

  console.log("[PayHero] Sending:", JSON.stringify(requestBody));

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  let phData: unknown;
  let phStatus: number;
  try {
    const phRes = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(requestBody),
    });

    phStatus = phRes.status;

    // PayHero sometimes returns non-JSON on errors
    const raw = await phRes.text();
    console.log(`[PayHero] Response ${phStatus}:`, raw);

    try { phData = JSON.parse(raw); } catch { phData = { raw }; }

    if (!phRes.ok) {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);

      const d = phData as Record<string, unknown>;
      const msg =
        (d?.error_message as string) ??
        (d?.message as string) ??
        (d?.error as string) ??
        (d?.detail as string) ??
        (d?.raw as string) ??
        `PayHero error ${phStatus}`;

      return NextResponse.json({ error: msg }, { status: 502 });
    }
  } catch (err) {
    console.error("PayHero fetch error:", err);
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json({ error: "Could not reach PayHero. Check your internet connection." }, { status: 502 });
  }

  return NextResponse.json({ paymentId: payment.id, payhero: phData });
}
