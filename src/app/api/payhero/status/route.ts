import { NextRequest, NextResponse } from "next/server";

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";

function getAuth(): string {
  const u = process.env.PAYHERO_API_USERNAME;
  const p = process.env.PAYHERO_API_PASSWORD;
  if (!u || !p) throw new Error("PayHero credentials not configured.");
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
}

function extractStatus(data: Record<string, unknown>): string {
  // Try every known shape PayHero uses
  const raw =
    data.status ??
    data.Status ??
    (data.data as Record<string, unknown>)?.status ??
    (data.transaction as Record<string, unknown>)?.status ??
    data.response_status ??
    "";

  let status = String(raw).toUpperCase().trim();

  // Map response-code based success ("0" = success on M-Pesa gateway)
  const code = String(data.response_code ?? data.ResponseCode ?? data.ResultCode ?? "").trim();
  if ((code === "0" || code === "00") && (!status || status === "PENDING")) status = "SUCCESS";

  // Explicit failure signals
  if (data.success === false && (!status || status === "PENDING")) status = "FAILED";

  // Aliases PayHero may use
  if (status === "COMPLETE") status = "SUCCESS";
  if (status === "COMPLETED") status = "SUCCESS";
  if (status === "SUCCESSFUL") status = "SUCCESS";
  if (status === "CANCELLED" || status === "CANCELED") status = "FAILED";

  return status || "PENDING";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  let auth: string;
  try {
    auth = getAuth();
  } catch {
    return NextResponse.json({ error: "Payment service not configured." }, { status: 503 });
  }

  try {
    const phRes = await fetch(
      `${PAYHERO_BASE}/transaction-status?reference=${encodeURIComponent(ref)}`,
      { headers: { Authorization: auth }, cache: "no-store" }
    );

    const data = await phRes.json() as Record<string, unknown>;
    console.log("[PayHero status]", ref, JSON.stringify(data));

    const status = extractStatus(data);
    return NextResponse.json({ status, raw: data });
  } catch (err) {
    console.error("PayHero status error:", err);
    return NextResponse.json({ status: "PENDING", raw: {} });
  }
}
