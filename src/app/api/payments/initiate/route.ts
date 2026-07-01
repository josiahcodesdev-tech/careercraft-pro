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

  if (!username || !password || !channelId || !callbackUrl) {
    return NextResponse.json({ error: "PayHero credentials not configured." }, { status: 503 });
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
    return NextResponse.json({ error: "Failed to create payment record." }, { status: 500 });
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  const phRes = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount,
      phone_number: phone,
      channel_id: Number(channelId),
      provider: "m-pesa",
      external_reference: payment.id,
      callback_url: callbackUrl,
    }),
  });

  const phData = await phRes.json();

  if (!phRes.ok) {
    // Mark payment as failed if PayHero rejected the request
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json({ error: phData?.message ?? "PayHero request failed." }, { status: 502 });
  }

  return NextResponse.json({ paymentId: payment.id, payhero: phData });
}
