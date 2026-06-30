import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

export async function GET() {
  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "Supabase service role key not configured." }, { status: 503 });
  }

  const [cvs, preps, enquiries, proposals] = await Promise.all([
    admin.from("cvs").select("id, full_name, template, created_at").order("created_at", { ascending: false }),
    admin.from("interview_preps").select("id, candidate_name, role_title, created_at").order("created_at", { ascending: false }),
    admin.from("enquiries").select("name, email, phone, service, message, created_at").order("created_at", { ascending: false }),
    admin.from("proposals").select("name, created_at").order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    cvDownloads: (cvs.data ?? []).map((r) => ({ id: r.id, name: r.full_name, template: r.template, date: r.created_at })),
    interviewPreps: (preps.data ?? []).map((r) => ({ id: r.id, name: r.candidate_name, role: r.role_title, date: r.created_at })),
    enquiries: (enquiries.data ?? []).map((r) => ({ ...r, date: r.created_at })),
    proposals: (proposals.data ?? []).map((r) => ({ ...r, date: r.created_at })),
  });
}
