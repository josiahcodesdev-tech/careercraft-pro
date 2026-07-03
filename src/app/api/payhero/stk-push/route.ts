import { NextRequest, NextResponse } from "next/server";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

function getAuth(): string {
  const u = process.env.PAYHERO_API_USERNAME;
  const p = process.env.PAYHERO_API_PASSWORD;
  if (!u || !p) throw new Error("PayHero credentials not configured.");
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
}

function normalisePhone(raw: string): string {
  let phone = raw.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  if (phone.startsWith("0")) phone = "254" + phone.slice(1);
  if (!phone.startsWith("254")) phone = "254" + phone;
  return phone;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { phone: string; amount: number; reference: string };

  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const callbackUrl = process.env.PAYHERO_CALLBACK_URL;

  if (!channelId) {
    return NextResponse.json({ error: "Payment service not configured." }, { status: 503 });
  }

  const phone = normalisePhone(body.phone || "");
  if (!/^2547\d{8}$|^2541\d{8}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number. Use format 07XXXXXXXX." }, { status: 400 });
  }

  let auth: string;
  try {
    auth = getAuth();
  } catch {
    return NextResponse.json({ error: "Payment service not configured." }, { status: 503 });
  }

  try {
    const res = await fetch(`${PAYHERO_BASE}/payments`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: body.amount,
        phone_number: phone,
        channel_id: Number(channelId),
        provider: "m-pesa",
        external_reference: body.reference,
        callback_url: callbackUrl,
      }),
    });

    const data = await res.json() as Record<string, unknown>;
    console.log("[PayHero STK push response]", JSON.stringify(data));

    if (!res.ok || data.success === false) {
      const msg = String(data.message || data.error || "Payment initiation failed.");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Return PayHero's checkout_request_id so the client can poll with it
    const checkoutRequestId = String(
      data.checkout_request_id ?? data.CheckoutRequestID ?? ""
    );

    return NextResponse.json({
      success: true,
      reference: body.reference,
      checkoutRequestId,
    });
  } catch (err) {
    console.error("PayHero STK push error:", err);
    return NextResponse.json({ error: "Could not reach payment service." }, { status: 500 });
  }
}
