import { NextRequest, NextResponse } from "next/server";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

function getAuth(): string {
  const u = process.env.PAYHERO_API_USERNAME;
  const p = process.env.PAYHERO_API_PASSWORD;
  if (!u || !p) throw new Error("PayHero credentials not configured.");
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
}

export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  let auth: string;
  try {
    auth = getAuth();
  } catch {
    return NextResponse.json({ error: "Payment service not configured." }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${PAYHERO_BASE}/transaction-status?reference=${encodeURIComponent(ref)}`,
      { headers: { Authorization: auth }, cache: "no-store" }
    );

    const data = await res.json() as Record<string, unknown>;

    // Normalise status across different PayHero response shapes
    let status: string = String(
      data.status ??
      (data.transaction as Record<string, unknown>)?.status ??
      "PENDING"
    ).toUpperCase();

    // Map code-based responses
    const code = String(data.response_code ?? data.ResultCode ?? "").trim();
    if (code === "0" && status === "PENDING") status = "SUCCESS";
    if (data.success === false && status === "PENDING") status = "FAILED";

    return NextResponse.json({ status, raw: data });
  } catch (err) {
    console.error("PayHero status error:", err);
    return NextResponse.json({ status: "PENDING" }); // keep polling on network error
  }
}
