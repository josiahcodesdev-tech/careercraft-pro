import type { OpportunityDraft } from "@/lib/opportunities";
import { TARGET_COUNTRIES } from "@/lib/scrapers/target-countries";
import { matchesServiceArea } from "@/lib/scrapers/service-keywords";

export interface ScrapeResult {
  drafts: OpportunityDraft[];
  error?: string;
}

// The UN Global Marketplace is the single tender board for most UN agencies —
// UNICEF, WFP, UNHCR, UNOPS, UN Women and the rest — so one source here covers
// buyers that would otherwise need a scraper each.
//
// There is no public JSON API, but the notice table is served by a POST
// endpoint that returns an HTML fragment, and robots.txt disallows only
// /UNUser/Documents/* — this listing is explicitly permitted.
const SEARCH_URL = "https://www.ungm.org/Public/Notice/Search";
const NOTICE_URL = "https://www.ungm.org/Public/Notice";

// UNGM caps a page at 15 rows and silently ignores anything larger — asking
// for 200 returns 15, which is how this first shipped reading a single day's
// postings as the whole feed. Pages are walked instead.
const PAGE_SIZE = 15;

// 12 pages is ~180 notices. UNGM posts on the order of 100 a day globally, so
// this covers a comfortable margin over the daily gap between scans without
// walking the whole board every morning.
const MAX_PAGES = 12;

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** "17-Aug-2026 18:00 (GMT 3.00)" — UNGM's format in both date columns. */
function parseUngmDate(value: string): string | null {
  const match = value.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (month === undefined) return null;
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function cellText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Column order in the notice table, confirmed against the live endpoint.
 * Index 0 is the save-to-favourites control, which carries no data.
 */
const COLUMN = {
  title: 1,
  deadline: 2,
  published: 3,
  agency: 4,
  noticeType: 5,
  reference: 6,
  country: 7,
} as const;

/**
 * "Open in a new window" is the accessible label on the title link, and
 * "Unsave this procurement opportunity" and the UNGM Pro upsell ride along in
 * the first cell. None of it belongs in a tender title.
 */
function cleanTitle(raw: string): string {
  return raw.replace(/\s*Open in a new window\s*/gi, " ").replace(/\s+/g, " ").trim();
}

const TARGET_ALIASES = TARGET_COUNTRIES.flatMap((country) =>
  country.aliases.map((alias) => alias.toLowerCase()),
);

function matchesTargetCountry(location: string): boolean {
  const text = location.toLowerCase();
  return TARGET_ALIASES.some((alias) => text.includes(alias));
}

async function fetchPage(pageIndex: number): Promise<string[]> {
  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // The endpoint is an internal one for the notice table; without a
      // browser-ish UA and referer it answers with an empty fragment.
      "User-Agent":
        "Mozilla/5.0 (compatible; CareerCraftBot/1.0; +https://mycareercraft.site)",
      Referer: "https://www.ungm.org/Public/Notice",
    },
    // SortField and SortAscending are load-bearing, not cosmetic: omit them and
    // the endpoint returns 200 with an empty table rather than an error.
    body: JSON.stringify({
      PageIndex: pageIndex,
      PageSize: PAGE_SIZE,
      SortField: "DatePublished",
      SortAscending: false,
    }),
  });

  if (!res.ok) throw new Error(`UNGM returned ${res.status}`);

  // Split on the row boundary rather than matching a balanced <div>, which a
  // regex cannot do — every row carries a data-noticeid, so that is the test
  // for whether a chunk is a real row.
  return (await res.text())
    .split(/(?=<div role="row")/)
    .filter((row) => /data-noticeid="\d+"/.test(row));
}

export async function fetchUngmNotices(): Promise<ScrapeResult> {
  try {
    const pages = await Promise.all(
      Array.from({ length: MAX_PAGES }, (_unused, index) => fetchPage(index)),
    );
    const rows = pages.flat();

    const seen = new Set<string>();
    const drafts: OpportunityDraft[] = [];

    for (const row of rows) {
      const noticeId = row.match(/data-noticeid="(\d+)"/)?.[1];
      if (!noticeId || seen.has(noticeId)) continue;

      const cells = row.split(/(?=<div role="cell")/).slice(1).map(cellText);
      const title = cleanTitle(cells[COLUMN.title] ?? "");
      if (!title) continue;

      const country = cells[COLUMN.country] ?? "";
      if (!matchesTargetCountry(country)) continue;
      if (!matchesServiceArea(`${title} ${cells[COLUMN.noticeType] ?? ""}`)) continue;

      seen.add(noticeId);
      drafts.push({
        source: "ungm",
        externalId: noticeId,
        title,
        organization: cells[COLUMN.agency]?.trim() || "UN",
        category: "rfp",
        location: country.trim() || null,
        // The deadline cell trails a countdown number the page uses for
        // sorting; parseUngmDate reads the date and ignores the rest.
        deadline: parseUngmDate(cells[COLUMN.deadline] ?? ""),
        sourceUrl: `${NOTICE_URL}/${noticeId}`,
        raw: {
          noticeType: cells[COLUMN.noticeType],
          reference: cells[COLUMN.reference],
          published: parseUngmDate(cells[COLUMN.published] ?? ""),
        },
      });
    }

    // An empty result is more likely a changed layout than a quiet day — UNGM
    // posts continuously — so say so rather than reporting a clean zero.
    if (rows.length === 0) {
      return { drafts: [], error: "UNGM returned no rows — the notice table layout may have changed" };
    }

    return { drafts };
  } catch (e) {
    return {
      drafts: [],
      error: e instanceof Error ? e.message : "Failed to fetch UNGM notices",
    };
  }
}
