import type { OpportunityDraft } from "@/lib/opportunities";
import { TARGET_COUNTRIES } from "@/lib/scrapers/target-countries";
import { matchesServiceArea } from "@/lib/scrapers/service-keywords";

export interface ScrapeResult {
  drafts: OpportunityDraft[];
  error?: string;
}

// The World Bank publishes every procurement notice through a public JSON
// search API — no key, no scraping. Verified against the live endpoint:
// v3 is a 404, v2 is the live one.
const API = "https://search.worldbank.org/api/v2/procnotices";

// Notice types worth surfacing. "Request for Expression of Interest" is where
// consultancy assignments live and is by far the highest-value type here; a
// "General Procurement Notice" is the early warning that one is coming.
//
// Deliberately excluded: "Contract Award" (the work is already gone — it is
// also the bulk of the corpus, 128 of a random 200) and "Invitation for Bids"
// (goods and civil works).
const NOTICE_TYPES = [
  "Request for Expression of Interest",
  "General Procurement Notice",
];

// How many of the most recent notices to pull per country and type. The API
// returns newest-first, so this is a recency window rather than a sample.
const ROWS_PER_QUERY = 40;

// The World Bank's country names match ours almost exactly — 20 of our 21
// verified live. Only the Gambia differs, and querying our spelling silently
// returns zero rather than erroring, so the override is what stops that
// country going quietly missing.
const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  Gambia: "Gambia, The",
};

interface ProcNotice {
  id?: string;
  notice_type?: string;
  noticedate?: string;
  project_ctry_name?: string;
  project_name?: string;
  bid_description?: string;
  bid_reference_no?: string;
  notice_text?: string;
  submission_date?: string;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(date.getTime())) return null;
  // Reject a rolled-over date (e.g. "31 February" becoming 3 March) rather
  // than reporting a deadline that was never in the notice.
  if (date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

/** "28-Jul-2026" — the format `noticedate` uses. */
function parseNoticeDate(value: string | undefined): string | null {
  const match = value?.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (month === undefined) return null;
  return toIsoDate(Number(match[3]), month, Number(match[1]));
}

/**
 * Digs a submission deadline out of the notice body.
 *
 * There is no structured field for this: `submission_date` is the publication
 * date, not the closing date (verified — the two are identical on every sample
 * checked). The real deadline, when it is stated at all, sits in the free-text
 * HTML, and on a live sample only one notice in eight stated one. So this
 * returns null often, by design — a wrong deadline on a tender is far worse
 * than a missing one.
 */
function extractDeadline(noticeText: string | undefined): string | null {
  if (!noticeText) return null;

  const text = noticeText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

  const trigger =
    /(?:deadline|no later than|not later than|on or before|closing date|must be (?:received|submitted) by)([\s\S]{0,120})/i;
  const window = text.match(trigger)?.[1];
  if (!window) return null;

  // "6th August 2026" / "6 August 2026"
  const dayFirst = window.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(\d{4})\b/);
  if (dayFirst) {
    const month = MONTHS[dayFirst[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) return toIsoDate(Number(dayFirst[3]), month, Number(dayFirst[1]));
  }

  // "August 6, 2026"
  const monthFirst = window.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].slice(0, 3).toLowerCase()];
    if (month !== undefined) return toIsoDate(Number(monthFirst[3]), month, Number(monthFirst[2]));
  }

  // "2026-08-06"
  const iso = window.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  // "06/08/2026" — day-first, which is the convention across these notices.
  const slash = window.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
  if (slash) return toIsoDate(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]));

  return null;
}

async function fetchNotices(
  country: string,
  noticeType: string,
): Promise<{ drafts: OpportunityDraft[]; error?: string }> {
  const url = new URL(API);
  url.searchParams.set("format", "json");
  url.searchParams.set("rows", String(ROWS_PER_QUERY));
  url.searchParams.set("notice_type", noticeType);
  url.searchParams.set("project_ctry_name", COUNTRY_NAME_OVERRIDES[country] ?? country);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return { drafts: [], error: `World Bank ${country} returned ${res.status}` };
    }

    const body = (await res.json()) as { procnotices?: ProcNotice[] };
    const notices = body.procnotices ?? [];

    const drafts = notices
      .filter((notice) => notice.id && notice.bid_description)
      .filter((notice) =>
        // Screen on the description plus the project name — a notice titled
        // only "Consultancy services" needs the project for any signal.
        matchesServiceArea(`${notice.bid_description} ${notice.project_name ?? ""}`),
      )
      .map((notice): OpportunityDraft => {
        const id = notice.id as string;
        return {
          source: "worldbank",
          // The notice id is stable and globally unique.
          externalId: id,
          title: (notice.bid_description as string).trim(),
          // The borrower runs the procurement; the Bank only funds it. Naming
          // the project rather than "World Bank" keeps the buyer accurate.
          organization: notice.project_name?.trim() || "World Bank",
          category: "rfp",
          location: notice.project_ctry_name?.trim() || country,
          deadline: extractDeadline(notice.notice_text),
          sourceUrl: `https://projects.worldbank.org/en/projects-operations/procurement-detail/${id}`,
          raw: {
            noticeType: notice.notice_type,
            noticeDate: parseNoticeDate(notice.noticedate),
            reference: notice.bid_reference_no,
            projectName: notice.project_name,
          },
        };
      });

    return { drafts };
  } catch (e) {
    return {
      drafts: [],
      error: e instanceof Error ? e.message : `Failed to fetch World Bank notices for ${country}`,
    };
  }
}

export async function fetchWorldBankNotices(): Promise<ScrapeResult> {
  const queries = TARGET_COUNTRIES.flatMap((country) =>
    NOTICE_TYPES.map((type) => fetchNotices(country.name, type)),
  );
  const results = await Promise.all(queries);

  // The same notice can be returned under more than one country query when a
  // project spans borders, so dedupe before handing them on.
  const seen = new Set<string>();
  const drafts = results
    .flatMap((r) => r.drafts)
    .filter((draft) => {
      if (seen.has(draft.externalId)) return false;
      seen.add(draft.externalId);
      return true;
    });

  const errors = results.map((r) => r.error).filter((e): e is string => Boolean(e));

  return {
    drafts,
    error: errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined,
  };
}
