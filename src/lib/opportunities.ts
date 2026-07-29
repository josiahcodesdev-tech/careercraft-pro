import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getSupabaseAdmin();
}

export type OpportunitySource = "reliefweb" | "devnetjobs" | "undp";
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

// VASOL's accreditations (NITA, TVETA, KASNEB, HRMPEB) are Kenya-specific, so
// Kenya-based opportunities get ranked to the top of the digest/dashboard.
export function isKenyaLocation(location: string | null | undefined): boolean {
  return (location ?? "").toLowerCase().includes("kenya");
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
    // Newest-scraped first (today at the top, older below), then by soonest
    // deadline within the same scrape batch.
    .order("first_seen_at", { ascending: false })
    .order("deadline", { ascending: true, nullsFirst: false })
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

export async function getScanEnabled(): Promise<boolean> {
  const { data, error } = await db()
    .from("opportunity_scan_settings")
    .select("enabled")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  // Default to enabled if the settings row doesn't exist yet for some reason.
  return data?.enabled !== false;
}

export async function setScanEnabled(enabled: boolean): Promise<void> {
  const { error } = await db()
    .from("opportunity_scan_settings")
    .upsert({ id: 1, enabled, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// When the scraper last touched the table, and how many rows that run saw.
// Derived from the data (a scan stamps every row it upserts with the same
// last_seen_at), so no separate scan-log table is needed. `newCount` is how
// many of those were brand-new that run (first_seen_at === last_seen_at).
export async function getLastScan(): Promise<{ at: string | null; seenCount: number; newCount: number }> {
  const { data, error } = await db()
    .from("opportunities")
    .select("last_seen_at")
    .order("last_seen_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const at = (data?.[0]?.last_seen_at as string | undefined) ?? null;
  if (!at) return { at: null, seenCount: 0, newCount: 0 };

  const { count: seenCount, error: e2 } = await db()
    .from("opportunities")
    .select("*", { count: "exact", head: true })
    .eq("last_seen_at", at);
  if (e2) throw new Error(e2.message);

  const { count: newCount, error: e3 } = await db()
    .from("opportunities")
    .select("*", { count: "exact", head: true })
    .eq("last_seen_at", at)
    .eq("first_seen_at", at);
  if (e3) throw new Error(e3.message);

  return { at, seenCount: seenCount ?? 0, newCount: newCount ?? 0 };
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
