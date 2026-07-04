import { getSupabaseAdmin } from "@/lib/supabase-admin";

// The Supabase client is created without a generated `Database` type, so
// query builder calls fall back to `never`. Cast to `any` at the boundary
// and rely on the typed return values below instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getSupabaseAdmin();
}

export interface CvEvent {
  id?: string;
  name: string;
  template: string;
  date: string;
}

export interface InterviewEvent {
  id?: string;
  name: string;
  role: string;
  date: string;
}

export interface EnquiryEvent {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  date: string;
}

export interface ProposalEvent {
  name: string;
  date: string;
}

export interface Analytics {
  cvDownloads: CvEvent[];
  interviewPreps: InterviewEvent[];
  enquiries: EnquiryEvent[];
  proposals: ProposalEvent[];
}

export async function trackCvDownload(
  event: { name: string; template: string },
  fullData: Record<string, unknown>
): Promise<string> {
  const { data, error } = await db()
    .from("cv_events")
    .insert({ name: event.name, template: event.template, data: fullData })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

export async function trackInterviewPrep(
  event: { name: string; role: string },
  fullData: Record<string, unknown>
): Promise<string> {
  const { data, error } = await db()
    .from("interview_events")
    .insert({ name: event.name, role: event.role, data: fullData })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

export async function listCvEvents(limit = 300): Promise<CvEvent[]> {
  const { data, error } = await db()
    .from("cv_events")
    .select("id, name, template, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    name: row.name as string,
    template: row.template as string,
    date: row.created_at as string,
  }));
}

export async function listInterviewEvents(limit = 300): Promise<InterviewEvent[]> {
  const { data, error } = await db()
    .from("interview_events")
    .select("id, name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    name: row.name as string,
    role: row.role as string,
    date: row.created_at as string,
  }));
}

export async function getCvEvent(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await db()
    .from("cv_events")
    .select("template, data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { ...(data.data as Record<string, unknown>), template: data.template };
}

export async function getInterviewEvent(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await db()
    .from("interview_events")
    .select("data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data.data as Record<string, unknown>;
}
