import type { OpportunityDraft } from "@/lib/opportunities";
import { TARGET_COUNTRY_ISO3 } from "@/lib/scrapers/target-countries";
import { serviceKeywordQuery } from "@/lib/scrapers/service-keywords";

export interface ScrapeResult {
  drafts: OpportunityDraft[];
  error?: string;
}

function dig(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function firstString(obj: unknown, path: string[]): string | undefined {
  const val = dig(obj, path);
  return typeof val === "string" && val !== "" ? val : undefined;
}

// ReliefWeb returns array-of-object fields (source, country, career_categories)
// even when there's a single value — join the `name`s for display.
function joinNames(obj: unknown, path: string[]): string | undefined {
  const val = dig(obj, path);
  if (!Array.isArray(val)) return undefined;
  const names = val
    .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>).name : undefined))
    .filter((n): n is string => typeof n === "string" && n !== "");
  return names.length > 0 ? names.join(", ") : undefined;
}

// Priority organisations tracked by source regardless of the keyword filter —
// their tenders/consultancies surface even when the title misses a program
// keyword. IUCN's own procurement portal forbids scraping (robots.txt
// Disallow: /), so ReliefWeb is the compliant channel; the others are
// development/conservation partners worth catching the same way. Combined into
// one OR'd source query so it's a single request. Add an org by extending this
// list (each entry OR's its name variants).
const TRACKED_ORGS = [
  'IUCN OR "International Union for Conservation of Nature"',
  'WWF OR "World Wide Fund" OR "World Wildlife Fund"',
  'FAO OR "Food and Agriculture Organization"',
  'GIZ OR "Deutsche Gesellschaft"',
];
const TRACKED_ORG_QUERY = TRACKED_ORGS.map((org) => `(${org})`).join(" OR ");

// One ReliefWeb /jobs query scoped to the target countries. `queryValue` is the
// full-text query; `queryFields` restricts which fields it matches (e.g. the
// source name for an org query) — omit to search the default fields.
async function queryReliefWebJobs(
  appname: string,
  queryValue: string,
  queryFields?: string[]
): Promise<OpportunityDraft[]> {
  const url = new URL("https://api.reliefweb.int/v2/jobs");
  url.searchParams.set("appname", appname);
  url.searchParams.set("query[value]", queryValue);
  if (queryFields) {
    for (const field of queryFields) url.searchParams.append("query[fields][]", field);
  }
  // Restrict to African English-speaking nations at the API level — combined
  // with `query[value]` via an implicit AND, per ReliefWeb's filter semantics.
  url.searchParams.set("filter[field]", "country.iso3");
  for (const iso3 of TARGET_COUNTRY_ISO3) {
    url.searchParams.append("filter[value][]", iso3);
  }
  url.searchParams.set("filter[operator]", "OR");
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort[]", "date:desc");
  for (const field of ["title", "url", "source.name", "country.name", "city.name", "date.closing"]) {
    url.searchParams.append("fields[include][]", field);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`ReliefWeb API returned ${res.status}`);
  const json = await res.json();
  const items = Array.isArray(json?.data) ? (json.data as unknown[]) : [];

  return items
    .map((item): OpportunityDraft => {
      const id = String(dig(item, ["id"]) ?? "");
      const title = firstString(item, ["fields", "title"]) ?? "Untitled listing";
      const sourceUrl = firstString(item, ["fields", "url"]) ?? "https://reliefweb.int/jobs";
      const organization = joinNames(item, ["fields", "source"]);
      const country = joinNames(item, ["fields", "country"]);
      const city = joinNames(item, ["fields", "city"]);
      const location = [city, country].filter(Boolean).join(", ") || undefined;
      const deadlineRaw = firstString(item, ["fields", "date", "closing"]);
      const deadline = deadlineRaw ? deadlineRaw.slice(0, 10) : null;

      return { source: "reliefweb", externalId: id, title, organization, category: "job", location, deadline, sourceUrl, raw: item };
    })
    .filter((d) => d.externalId);
}

export async function fetchReliefWebJobs(): Promise<ScrapeResult> {
  const appname = process.env.RELIEFWEB_APPNAME;
  if (!appname) {
    return { drafts: [], error: "RELIEFWEB_APPNAME not configured" };
  }

  try {
    // Two passes: (1) the service-keyword feed (M&E/leadership/etc.), which
    // keeps the /jobs endpoint from returning every unrelated humanitarian
    // role; (2) tracked priority orgs (IUCN) by source, regardless of keyword.
    const [byKeyword, byOrg] = await Promise.all([
      queryReliefWebJobs(appname, serviceKeywordQuery()),
      queryReliefWebJobs(appname, TRACKED_ORG_QUERY, ["source.name", "source.shortname"]),
    ]);

    // Dedup by externalId — an IUCN job that also matched a keyword appears once.
    const byId = new Map<string, OpportunityDraft>();
    for (const draft of [...byKeyword, ...byOrg]) byId.set(draft.externalId, draft);

    return { drafts: [...byId.values()] };
  } catch (e) {
    return { drafts: [], error: e instanceof Error ? e.message : "Failed to fetch ReliefWeb jobs" };
  }
}
