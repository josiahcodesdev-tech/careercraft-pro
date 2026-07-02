import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { setPending } from "@/lib/payment-store";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\s/g, "").replace(/^\+/, "");
  if (digits.startsWith("254") && digits.length === 12) return "0" + digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  if (digits.length === 9) return "0" + digits;
  return digits;
}

export async function POST(req: NextRequest) {
  const { phone, amount, tier } = await req.json();

  if (!phone || !amount || !tier) {
    return NextResponse.json({ error: "phone, amount, and tier are required." }, { status: 400 });
  }

  const username = process.env.PAYHERO_API_USERNAME;
  const password = process.env.PAYHERO_API_PASSWORD;
  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const callbackUrl = process.env.PAYHERO_CALLBACK_URL;

  if (!username || !password || !channelId) {
    return NextResponse.json({ error: "PayHero credentials are not configured." }, { status: 503 });
  }
  if (!callbackUrl) {
    return NextResponse.json({ error: "PAYHERO_CALLBACK_URL is not set." }, { status: 503 });
  }

  const ref = randomUUID();
  setPending(ref, tier);

  const normalizedPhone = normalizePhone(phone);
  const body = {
    amount: Number(amount),
    phone_number: normalizedPhone,
    channel_id: Number(channelId),
    provider: "mpesa",
    external_reference: ref,
    callback_url: callbackUrl,
  };

  console.log("[PayHero] Initiating:", JSON.stringify({ ...body, phone_number: "***" }));

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const phRes = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await phRes.text();
    console.log(`[PayHero] Response ${phRes.status}:`, raw);

    if (!phRes.ok) {
      let d: Record<string, unknown> = {};
      try { d = JSON.parse(raw); } catch { /* ignore */ }
      const msg =
        (d.error_message as string) ?? (d.message as string) ??
        (d.error as string) ?? (d.detail as string) ?? `PayHero error ${phRes.status}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Could not reach PayHero." }, { status: 502 });
  }

  return NextResponse.json({ ref });
}
