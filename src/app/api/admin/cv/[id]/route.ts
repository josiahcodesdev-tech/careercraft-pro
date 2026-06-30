import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Supabase service role key not configured." }, { status: 503 });
  }
  const { id } = await params;
  const { data, error } = await admin.from("cvs").select("data").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: "CV not found." }, { status: 404 });
  }
  return NextResponse.json({ data: data.data });
}
