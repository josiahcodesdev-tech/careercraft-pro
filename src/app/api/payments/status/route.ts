import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { data: rows } = await admin
    .from("payments")
    .select("status, tier, expires_at")
    .eq("id", id)
    .limit(1);

  const data = rows?.[0];
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
