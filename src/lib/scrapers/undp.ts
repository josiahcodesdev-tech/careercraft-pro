import type { OpportunityDraft } from "@/lib/opportunities";
import { TARGET_COUNTRY_ISO3 } from "@/lib/scrapers/target-countries";

export interface ScrapeResult {
  drafts: OpportunityDraft[];
  error?: string;
}

// UNDP's procurement site (Coldfusion-based) blocks generic bot/crawler
// access at the page level, but publishes plain RSS 2.0 feeds per country at
// a predictable URL built from the ISO3 code — the same codes we already
// use to scope the ReliefWeb feed. Reusing TARGET_COUNTRY_ISO3 here keeps
// both scrapers scoped to the same country list rather than maintaining a
// second one, and avoids needing to reverse-engineer the region-level feed
// slugs (Africa / Asia-Pacific / etc.), which aren't confirmed anywhere.
function feedUrlFor(iso3: string): string {
  return `https://procurement-notices.undp.org/rss_feeds/${iso3}.xml`;
}

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  // UNDP's RDF items carry the useful data in namespaced elements rather
  // than the plain RSS 2.0 ones.
  deadline?: string; // <undpprocnot:deadline> — ISO-8601, the reliable source
  country?: string; // <undpprocnot:duty_station_cty>
}

// Minimal, dependency-free RDF/RSS item extractor. UNDP publishes RSS 1.0
// (RDF) with namespaced children (dc:*, undpprocnot:*); the tag name may
// contain a ":" but that's a literal in the regex, so this handles both plain
// and namespaced tags without an XML parser dependency.
function extractTagText(itemXml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = itemXml.match(re);
  if (!match) return undefined;
  return decodeXmlText(match[1]);
}

function decodeXmlText(raw: string): string {
  let text = raw.trim();
  // Strip CDATA wrapper if present.
  const cdataMatch = text.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdataMatch) text = cdataMatch[1].trim();
  // Decode the handful of entities RSS feeds actually use.
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseRssItems(xml: string): RssItem[] {
  // The \b (word boundary) after "item" is load-bearing: UNDP's feed opens
  // with an <items><rdf:Seq> index element, and a plain /<item[^>]*>/ matches
  // that too, capturing a mangled span with no real fields. \b forces a match
  // on <item …> / <item> only, never <items>.
  const itemBlocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? [];
  return itemBlocks.map((block) => ({
    title: extractTagText(block, "title"),
    link: extractTagText(block, "link"),
    description: extractTagText(block, "description"),
    deadline: extractTagText(block, "undpprocnot:deadline"),
    country: extractTagText(block, "undpprocnot:duty_station_cty"),
  }));
}

const DEADLINE_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// UNDP titles are typically formatted as
// "<reference> - <notice title> - UNDP - <COUNTRY>". We only use this to
// recover a display location; if the pattern doesn't match we just fall
// back to leaving location undefined rather than guessing.
function extractCountryFromTitle(title: string): string | undefined {
  const parts = title.split(" - ");
  const last = parts[parts.length - 1]?.trim();
  return last && last.toUpperCase() === last && last.length > 1 ? last : undefined;
}

// UNDP notices expose the deadline two ways: the structured, ISO-8601
// <undpprocnot:deadline> element (preferred), and a "Application Deadline:
// 14-Aug-26" string inside <description> (fallback for the rare item missing
// the structured field). Returns a YYYY-MM-DD string or null.
function extractDeadline(item: RssItem): string | null {
  if (item.deadline && /^\d{4}-\d{2}-\d{2}/.test(item.deadline)) {
    return item.deadline.slice(0, 10);
  }
  const match = item.description?.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
  if (match) {
    const [, day, monthName, yy] = match;
    const month = DEADLINE_MONTHS[monthName.toLowerCase()];
    if (month !== undefined) {
      const date = new Date(Date.UTC(2000 + Number(yy), month, Number(day)));
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }
  return null;
}

async function fetchCountryFeed(iso3: string): Promise<{ drafts: OpportunityDraft[]; error?: string }> {
  const url = feedUrlFor(iso3);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Not every country has an active feed; UNDP returns non-200 for
      // those rather than an empty valid feed, so treat as "no results"
      // rather than a hard error unless it's something unexpected like 403.
      if (res.status === 404) return { drafts: [] };
      return { drafts: [], error: `UNDP feed for ${iso3} returned ${res.status}` };
    }
    const xml = await res.text();
    const items = parseRssItems(xml);

    const drafts: OpportunityDraft[] = items
      .filter((item) => item.title && item.link)
      .map((item) => {
        const title = item.title as string;
        const sourceUrl = item.link as string;
        // Prefer the structured duty-station country; fall back to parsing it
        // out of the title's trailing "… - COUNTRY" segment.
        const location = item.country?.trim() || extractCountryFromTitle(title);

        return {
          source: "undp",
          // The notice URL is stable and unique per tender, so it doubles as
          // the external id (the feed has no <guid>).
          externalId: sourceUrl,
          title,
          organization: "UNDP",
          // Procurement notices are tenders; reuse the existing "rfp"
          // category so they surface under the dashboard's "RFPs / Tenders"
          // filter alongside DevNetJobs RFPs rather than adding a third bucket.
          category: "rfp",
          location,
          deadline: extractDeadline(item),
          sourceUrl,
          raw: item,
        };
      });

    return { drafts };
  } catch (e) {
    return { drafts: [], error: e instanceof Error ? e.message : `Failed to fetch UNDP feed for ${iso3}` };
  }
}

export async function fetchUndpProcurementNotices(): Promise<ScrapeResult> {
  const results = await Promise.all(TARGET_COUNTRY_ISO3.map(fetchCountryFeed));

  const drafts = results.flatMap((r) => r.drafts).filter((d) => d.externalId);
  const errors = results.map((r) => r.error).filter((e): e is string => Boolean(e));

  return {
    drafts,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}