import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getSupabaseAdmin();
}

export type OpportunitySource = "reliefweb" | "devnetjobs";
export type OpportunityCategory = "rfp" | "job";
export type OpportunityStatus = "new" | "reviewing" | "applied" | "ignored";

export interface Opportunity {
  id: string;
  source: OpportunitySource;
  externalId: string;
  title: string;
  organization: string | null;
  category: OpportunityCategory;
  location: string | null;
  deadline: string | null;
  sourceUrl: string;
  status: OpportunityStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface OpportunityDraft {
  source: OpportunitySource;
  externalId: string;
  title: string;
  organization?: string | null;
  category: OpportunityCategory;
  location?: string | null;
  deadline?: string | null;
  sourceUrl: string;
  raw?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOpportunity(row: any): Opportunity {
  return {
    id: row.id as string,
    source: row.source as OpportunitySource,
    externalId: row.external_id as string,
    title: row.title as string,
    organization: (row.organization as string | null) ?? null,
    category: row.category as OpportunityCategory,
    location: (row.location as string | null) ?? null,
    deadline: (row.deadline as string | null) ?? null,
    sourceUrl: row.source_url as string,
    status: row.status as OpportunityStatus,
    firstSeenAt: row.first_seen_at as string,
    lastSeenAt: row.last_seen_at as string,
  };
}

// Upsert payload intentionally omits `status` — Postgres's ON CONFLICT DO
// UPDATE (what supabase-js's `.upsert()` generates) only touches columns
// present in the payload, so an admin's manual status change survives the
// next re-scrape instead of being reset back to "new".
export async function upsertOpportunities(rows: OpportunityDraft[]): Promise<number> {
  if (rows.length === 0) return 0;

  const now = new Date().toISOString();
  const payload = rows.map((r) => ({
    source: r.source,
    external_id: r.externalId,
    title: r.title,
    organization: r.organization ?? null,
    category: r.category,
    location: r.location ?? null,
    deadline: r.deadline ?? null,
    source_url: r.sourceUrl,
    raw: r.raw ?? null,
    last_seen_at: now,
  }));

  const { error } = await db()
    .from("opportunities")
    .upsert(payload, { onConflict: "source,external_id" });
  if (error) throw new Error(error.message);
  return payload.length;
}

export async function listOpportunities(opts?: {
  status?: string;
  category?: string;
  source?: string;
}): Promise<Opportunity[]> {
  let query = db()
    .from("opportunities")
    .select(
      "id, source, external_id, title, organization, category, location, deadline, source_url, status, first_seen_at, last_seen_at"
    )
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("first_seen_at", { ascending: false })
    .limit(500);

  if (opts?.status && opts.status !== "all") query = query.eq("status", opts.status);
  if (opts?.category && opts.category !== "all") query = query.eq("category", opts.category);
  if (opts?.source && opts.source !== "all") query = query.eq("source", opts.source);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => toOpportunity(row));
}

export async function updateOpportunityStatus(id: string, status: OpportunityStatus): Promise<void> {
  const { error } = await db().from("opportunities").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getOpportunityCounts(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  const { data, error } = await db().from("opportunities").select("status, category");
  if (error) throw new Error(error.message);

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
  }
  return { total: (data ?? []).length, byStatus, byCategory };
}
