import { createHash } from "crypto";
import * as cheerio from "cheerio";
import type { OpportunityDraft } from "@/lib/opportunities";
import { matchesTargetCountry } from "@/lib/scrapers/target-countries";
import { matchesServiceArea } from "@/lib/scrapers/service-keywords";

export interface ScrapeResult {
  drafts: OpportunityDraft[];
  error?: string;
}

const RFP_LISTING_URL = "https://devnetjobs.org/rfp_assignments.aspx";

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// "Apply by: 12 Jul 2026" -> "2026-07-12". Falls back to null (not thrown)
// so an unexpected date format doesn't drop the whole row — the raw text
// stays available in `raw` for debugging.
function parseApplyByDate(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
  if (month === undefined) return null;
  const date = new Date(Date.UTC(Number(year), month, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function stripLabel(text: string | undefined, label: string): string | undefined {
  if (!text) return undefined;
  const cleaned = text.replace(new RegExp(`^${label}\\s*:?\\s*`, "i"), "").trim();
  return cleaned || undefined;
}

function syntheticId(title: string, organization: string, deadlineRaw: string): string {
  return createHash("sha1")
    .update(`${title.trim().toLowerCase()}|${organization.trim().toLowerCase()}|${deadlineRaw.trim().toLowerCase()}`)
    .digest("hex");
}

export async function fetchDevNetJobsRfps(): Promise<ScrapeResult> {
  try {
    const res = await fetch(RFP_LISTING_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MyCareerCraftBot/1.0)" },
    });
    if (!res.ok) {
      return { drafts: [], error: `DevNetJobs returned ${res.status}` };
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const drafts: OpportunityDraft[] = [];
    let parsedCount = 0;
    $("tr.gridRow").each((_, row) => {
      const $row = $(row);
      const title = $row.find('[id$="_lblJobTitle"]').first().text().trim();
      if (!title) return;

      const organization = $row.find('[id$="_lblJobCo"]').first().text().trim();
      const locationRaw = $row.find('[id$="_lblLocation"]').first().text().trim();
      const deadlineRaw = $row.find('[id$="_lblApplyDate"]').first().text().trim();

      parsedCount++;

      // Restrict to African English-speaking nations — DevNetJobs has no
      // structured country field, just this free-text location string.
      if (!matchesTargetCountry(locationRaw)) return;

      // Restrict to the service areas offered. DevNetJobs rows carry no
      // description, so the assignment title is the only text to screen on —
      // an RFP whose title doesn't name the service will be missed.
      if (!matchesServiceArea(title)) return;

      const location = stripLabel(locationRaw, "Location");
      const deadline = parseApplyByDate(deadlineRaw);

      drafts.push({
        source: "devnetjobs",
        externalId: syntheticId(title, organization, deadlineRaw),
        title,
        organization: organization || undefined,
        category: "rfp",
        location,
        deadline,
        sourceUrl: RFP_LISTING_URL,
        raw: { title, organization, locationRaw, deadlineRaw },
      });
    });

    // Only treat "nothing parsed at all" as a broken-selector warning — most
    // rows legitimately not matching a target country is expected, not an error.
    if (parsedCount === 0) {
      return { drafts: [], error: "Parsed 0 rows from a 200 response — selectors may be stale" };
    }

    return { drafts };
  } catch (e) {
    return { drafts: [], error: e instanceof Error ? e.message : "Failed to fetch DevNetJobs RFPs" };
  }
}
