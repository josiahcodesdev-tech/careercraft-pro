import { NextRequest, NextResponse } from "next/server";
import { resolve } from "@/lib/payment-store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[PayHero] Callback:", JSON.stringify(body));

  const { status, external_reference: ref } = body;
  if (!ref) return NextResponse.json({ error: "Missing external_reference." }, { status: 400 });

  resolve(ref, status === "SUCCESS" ? "success" : "failed");

  return NextResponse.json({ received: true });
}
