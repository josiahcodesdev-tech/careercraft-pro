import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

// Poll this to check if a service has been unlocked on the user's profile.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const tier = req.nextUrl.searchParams.get("tier");

  if (!userId || !tier) {
    return NextResponse.json({ error: "userId and tier are required." }, { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "DB not configured." }, { status: 503 });

  const { data: profile, error } = await admin
    .from("profiles")
    .select("services")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  const services: string[] = profile?.services ?? [];
  const active = services.includes(tier) || services.includes("bundle");

  return NextResponse.json({ active });
}
