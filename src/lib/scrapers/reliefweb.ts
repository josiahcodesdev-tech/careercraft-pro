import type { OpportunityDraft } from "@/lib/opportunities";

export interface ScrapeResult {
  drafts: OpportunityDraft[];
  error?: string;
}

// Keeps this feed focused on the user's niche (M&E / MEAL consulting) rather
// than every humanitarian job ReliefWeb has — their /jobs endpoint isn't
// RFP/tender-specific, so without a keyword filter it would return roles
// like logistics or medical that aren't relevant leads.
const ME_KEYWORDS = '"monitoring and evaluation" OR "M&E" OR MEAL OR "monitoring, evaluation" OR "results measurement"';

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
  url.searchParams.set("query[value]", ME_KEYWORDS);
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
