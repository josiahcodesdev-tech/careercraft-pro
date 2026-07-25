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

export async function fetchReliefWebJobs(): Promise<ScrapeResult> {
  const appname = process.env.RELIEFWEB_APPNAME;
  if (!appname) {
    return { drafts: [], error: "RELIEFWEB_APPNAME not configured" };
  }

  const url = new URL("https://api.reliefweb.int/v2/jobs");
  url.searchParams.set("appname", appname);
  // Keep this feed focused on the services offered rather than every
  // humanitarian job ReliefWeb has — the /jobs endpoint isn't RFP-specific, so
  // without a keyword filter it returns unrelated logistics/medical roles. The
  // phrase list is centralised in service-keywords.ts (M&E, leadership,
  // strategic planning, education-systems review).
  url.searchParams.set("query[value]", serviceKeywordQuery());
  // Restrict to African English-speaking nations at the API level rather
  // than filtering client-side after fetching — combined with `query[value]`
  // via an implicit AND, per ReliefWeb's filter semantics.
  url.searchParams.set("filter[field]", "country.iso3");
  for (const iso3 of TARGET_COUNTRY_ISO3) {
    url.searchParams.append("filter[value][]", iso3);
  }
  url.searchParams.set("filter[operator]", "OR");
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort[]", "date:desc");
  url.searchParams.append("fields[include][]", "title");
  url.searchParams.append("fields[include][]", "url");
  url.searchParams.append("fields[include][]", "source.name");
  url.searchParams.append("fields[include][]", "country.name");
  url.searchParams.append("fields[include][]", "city.name");
  url.searchParams.append("fields[include][]", "date.closing");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return { drafts: [], error: `ReliefWeb API returned ${res.status}` };
    }
    const json = await res.json();
    const items = Array.isArray(json?.data) ? (json.data as unknown[]) : [];

    const drafts: OpportunityDraft[] = items.map((item) => {
      const id = String(dig(item, ["id"]) ?? "");
      const title = firstString(item, ["fields", "title"]) ?? "Untitled listing";
      const sourceUrl = firstString(item, ["fields", "url"]) ?? "https://reliefweb.int/jobs";
      const organization = joinNames(item, ["fields", "source"]);
      const country = joinNames(item, ["fields", "country"]);
      const city = joinNames(item, ["fields", "city"]);
      const location = [city, country].filter(Boolean).join(", ") || undefined;
      const deadlineRaw = firstString(item, ["fields", "date", "closing"]);
      const deadline = deadlineRaw ? deadlineRaw.slice(0, 10) : null;

      return {
        source: "reliefweb",
        externalId: id,
        title,
        organization,
        category: "job",
        location,
        deadline,
        sourceUrl,
        raw: item,
      };
    });

    return { drafts: drafts.filter((d) => d.externalId) };
  } catch (e) {
    return { drafts: [], error: e instanceof Error ? e.message : "Failed to fetch ReliefWeb jobs" };
  }
}
