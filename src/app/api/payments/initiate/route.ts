import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\s/g, "").replace(/^\+/, "");
  if (digits.startsWith("254") && digits.length === 12) return "0" + digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  if (digits.length === 9) return "0" + digits;
  return digits;
}

export async function POST(req: NextRequest) {
  const { phone, amount, tier, userId } = await req.json();

  if (!phone || !amount || !tier || !userId) {
    return NextResponse.json(
      { error: "phone, amount, tier, and userId are required." },
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
      { error: "PAYHERO_CALLBACK_URL is not set." },
      { status: 503 }
    );
  }

  // Encode tier and userId in the reference so the callback can write to profiles
  // Format: tier::userId::uuid  (uuid is just for uniqueness)
  const externalRef = `${tier}::${userId}::${randomUUID()}`;
  const normalizedPhone = normalizePhone(phone);

  const body = {
    amount: Number(amount),
    phone_number: normalizedPhone,
    channel_id: Number(channelId),
    provider: "mpesa",
    external_reference: externalRef,
    callback_url: callbackUrl,
  };

  console.log("[PayHero] Initiating:", JSON.stringify({ ...body, phone_number: "***" }));

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
    return NextResponse.json({ error: "Could not reach PayHero." }, { status: 502 });
  }

  // Return the ref so the client can poll /api/payments/status
  return NextResponse.json({ ref: externalRef });
}
