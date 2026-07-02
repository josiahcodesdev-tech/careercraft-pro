import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\s/g, "").replace(/^\+/, "");
  if (digits.startsWith("254") && digits.length === 12) return "0" + digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  if (digits.length === 9) return "0" + digits;
  return digits;
}

export async function POST(req: NextRequest) {
  const { phone, amount, tier, userId } = await req.json();

  if (!phone || !amount || !tier) {
    return NextResponse.json(
      { error: "phone, amount, and tier are required." },
      { status: 400 }
    );
  }

  const username = process.env.PAYHERO_API_USERNAME;
  const password = process.env.PAYHERO_API_PASSWORD;
  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const callbackUrl = process.env.PAYHERO_CALLBACK_URL;

  if (!username || !password || !channelId) {
    return NextResponse.json(
      { error: "PayHero credentials are not configured on the server." },
      { status: 503 }
    );
  }
  if (!callbackUrl) {
    return NextResponse.json(
      { error: "PAYHERO_CALLBACK_URL is not set. Add it to your environment variables." },
      { status: 503 }
    );
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { error: "Database not configured. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  // Create a pending payment row
  const { data: rows, error: dbError } = await admin
    .from("payments")
    .insert({
      user_id: userId ?? null,
      provider: "mpesa",
      amount: Number(amount),
      tier,
      status: "pending",
    })
    .select("id");

  if (dbError || !rows?.length) {
    console.error("[Payments] DB insert error:", dbError);
    const msg =
      dbError?.code === "42P01"
        ? "The payments table does not exist. Run the schema SQL in Supabase."
        : (dbError?.message ?? "Failed to create payment record.");
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const paymentId = rows[0].id as string;
  const normalizedPhone = normalizePhone(phone);

  const body = {
    amount: Number(amount),
    phone_number: normalizedPhone,
    channel_id: Number(channelId),
    provider: "mpesa",
    external_reference: paymentId,
    callback_url: callbackUrl,
  };

  console.log("[PayHero] Initiating STK push:", JSON.stringify(body));

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  let phStatus: number;
  let phData: unknown;
  try {
    const phRes = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(body),
    });

    phStatus = phRes.status;
    const raw = await phRes.text();
    console.log(`[PayHero] Response ${phStatus}:`, raw);

    try { phData = JSON.parse(raw); } catch { phData = { raw }; }

    if (!phRes.ok) {
      await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
      const d = phData as Record<string, unknown>;
      const errMsg =
        (d?.error_message as string) ??
        (d?.message as string) ??
        (d?.error as string) ??
        (d?.detail as string) ??
        `PayHero returned ${phStatus}`;
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }
  } catch (err) {
    console.error("[PayHero] Fetch error:", err);
    await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
    return NextResponse.json({ error: "Could not reach PayHero." }, { status: 502 });
  }

  return NextResponse.json({ paymentId });
}
