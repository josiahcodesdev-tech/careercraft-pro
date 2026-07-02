import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

// PayHero POSTs here after the M-Pesa transaction completes.
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[PayHero] Callback:", JSON.stringify(body));

  // external_reference is "tier::userId::uuid" (encoded by initiate route)
  const { status, external_reference } = body;

  if (!external_reference) {
    return NextResponse.json({ error: "Missing external_reference." }, { status: 400 });
  }

  const parts = (external_reference as string).split("::");
  const tier = parts[0];
  const userId = parts[1];

  if (!tier || !userId) {
    return NextResponse.json({ error: "Invalid external_reference format." }, { status: 400 });
  }

  if (status !== "SUCCESS") {
    console.log(`[PayHero] Payment not successful (${status}) for ${tier} / ${userId}`);
    return NextResponse.json({ received: true });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // Read current services, append the new tier, write back
  const { data: profile } = await admin
    .from("profiles")
    .select("services")
    .eq("id", userId)
    .single();

  const current: string[] = profile?.services ?? [];
  if (!current.includes(tier)) {
    const updated = [...current, tier];
    const { error } = await admin
      .from("profiles")
      .upsert({ id: userId, services: updated });

    if (error) {
      console.error("[Payments] Profile update error:", error);
      return NextResponse.json({ error: "Failed to unlock service." }, { status: 500 });
    }
  }

  console.log(`[PayHero] Unlocked '${tier}' for user ${userId}`);
  return NextResponse.json({ received: true });
}
