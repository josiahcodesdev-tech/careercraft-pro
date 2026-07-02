import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref." }, { status: 400 });

  // ref format: "{uuid}::{tier}" — parse tier from ref without shared state
  const sepIdx = ref.indexOf("::");
  const tier = sepIdx !== -1 ? ref.slice(sepIdx + 2) : "";

  const username = process.env.PAYHERO_API_USERNAME;
  const password = process.env.PAYHERO_API_PASSWORD;

  if (!username || !password) {
    return NextResponse.json({ status: "pending" });
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const res = await fetch(
      `https://backend.payhero.co.ke/api/v2/transaction_status?external_reference=${encodeURIComponent(ref)}`,
      { headers: { Authorization: `Basic ${credentials}` } }
    );

    if (!res.ok) {
      console.log(`[PayHero] Status check ${res.status} for ref=${ref}`);
      return NextResponse.json({ status: "pending" });
    }

    const data = (await res.json()) as { status?: string; Status?: string };
    const phStatus = (data.status ?? data.Status ?? "").toUpperCase();

    console.log("[PayHero] Transaction status:", phStatus, "tier:", tier);

    if (phStatus === "SUCCESS") return NextResponse.json({ status: "success", tier });
    if (phStatus === "FAILED" || phStatus === "CANCELLED") return NextResponse.json({ status: "failed", tier });
    return NextResponse.json({ status: "pending" });
  } catch (err) {
    console.error("[PayHero] Status check error:", err);
    return NextResponse.json({ status: "pending" });
  }
}
