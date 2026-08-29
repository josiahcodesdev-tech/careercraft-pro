import { NextRequest, NextResponse } from "next/server";
import { extractCheckoutRequestId } from "@/lib/payhero";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPaymentsEnabled } from "@/lib/settings";
import {
  findCountry,
  isValidPhone,
  networkFor,
  normalisePhone,
  priceFor,
  type ProductId,
} from "@/lib/payment-countries";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

function getAuth(): string {
  const u = process.env.PAYHERO_API_USERNAME;
  const p = process.env.PAYHERO_API_PASSWORD;
  if (!u || !p) throw new Error("PayHero credentials not configured.");
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    phone: string;
    product: ProductId;
    reference: string;
    country?: string;
  };

  // Nobody should get an M-Pesa prompt during a giveaway. The forms already
  // hide the paywall when payments are off, but a stale tab left open across
  // the toggle would otherwise still push a charge to someone's phone.
  if (!(await getPaymentsEnabled())) {
    return NextResponse.json(
      { error: "Payments are currently disabled — downloads are free." },
      { status: 409 }
    );
  }

  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const callbackSecret = process.env.PAYHERO_CALLBACK_SECRET;

  if (!channelId || !process.env.PAYHERO_CALLBACK_URL || !callbackSecret) {
    return NextResponse.json({ error: "Payment service not configured." }, { status: 503 });
  }

  // Embed a secret token in the callback URL we hand PayHero, so
  // /api/payhero/callback can reject forged "payment succeeded" POSTs from
  // anyone who isn't PayHero itself — never exposed to the browser.
  const callbackUrl = new URL(process.env.PAYHERO_CALLBACK_URL);
  callbackUrl.searchParams.set("token", callbackSecret);

  // A country we have not switched on must never reach PayHero: an
  // unconfirmed rail would take the customer's money with nothing on our side
  // able to confirm it.
  const country = findCountry(body.country);
  if (!country || !country.enabled) {
    return NextResponse.json({ error: "Payments are not available in that country yet." }, { status: 400 });
  }

  // The price is read from our own table, never from the request. The browser
  // says which product it is buying; what that costs is not its decision.
  const amount = body.product === "cv" || body.product === "interview" ? priceFor(country, body.product) : 0;
  if (!amount) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  const phone = normalisePhone(body.phone || "", country);
  if (!isValidPhone(phone, country)) {
    return NextResponse.json(
      { error: `Invalid ${country.name} number. Use format ${country.hint}.` },
      { status: 400 }
    );
  }

  // Kenya keeps the plain "m-pesa" provider it has always sent; elsewhere the
  // network is read off the number's prefix, since one country has several.
  const network = networkFor(phone, country);

  // Cap STK pushes per phone number (don't let the site spam a stranger's
  // phone with M-Pesa prompts) and per IP (don't let one attacker cycle
  // through numbers).
  const byPhone = checkRateLimit(`stk:phone:${phone}`, 3, 10 * 60 * 1000);
  if (!byPhone.allowed) {
    return NextResponse.json(
      { error: "Too many payment attempts for this number. Please try again later." },
      { status: 429, headers: { "Retry-After": String(byPhone.retryAfterSeconds) } }
    );
  }
  const byIp = checkRateLimit(`stk:ip:${getClientIp(req)}`, 10, 60 * 60 * 1000);
  if (!byIp.allowed) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(byIp.retryAfterSeconds) } }
    );
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
        amount,
        phone_number: phone,
        channel_id: Number(channelId),
        provider: network?.provider ?? "m-pesa",
        external_reference: body.reference,
        callback_url: callbackUrl.toString(),
        // Kenya settles in the wallet's own currency and has never sent this;
        // keep it off that path so the working flow is byte-for-byte unchanged.
        ...(country.code === "KE" ? {} : { currency: country.currency }),
      }),
    });

    const data = await res.json() as Record<string, unknown>;
    console.log("[PayHero STK push response]", JSON.stringify(data));

    if (!res.ok || data.success === false) {
      const msg = String(data.message || data.error || "Payment initiation failed.");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Return PayHero's checkout_request_id so the client can poll with it
    const checkoutRequestId = extractCheckoutRequestId(data);

    return NextResponse.json({
      success: true,
      reference: body.reference,
      checkoutRequestId,
      amount,
      currency: country.currency,
    });
  } catch (err) {
    console.error("PayHero STK push error:", err);
    return NextResponse.json({ error: "Could not reach payment service." }, { status: 500 });
  }
}
