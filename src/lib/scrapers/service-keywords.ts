// The consulting services this feed hunts leads for. Centralised here so the
// scrapers share one definition of "relevant" — ReliefWeb turns these into an
// API full-text query, and `matchesServiceArea` can screen scrapers that only
// return plain text (DevNetJobs, UNDP) if we ever want to focus them too.
//
// Phrases are matched as-is: multi-word / punctuated phrases get quoted for
// the ReliefWeb query so they match as a unit rather than as loose words
// (e.g. "leadership training", not any job mentioning "leadership").
export interface ServiceArea {
  key: string;
  label: string;
  phrases: string[];
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    key: "me",
    label: "Monitoring & Evaluation",
    phrases: [
      "monitoring and evaluation",
      "monitoring & evaluation",
      "M&E",
      "M & E",
      "M+E",
      "MEAL",
      "monitoring, evaluation",
      "results measurement",
      "impact evaluation",
    ],
  },
  {
    key: "leadership",
    label: "Leadership training",
    phrases: [
      "leadership training",
      "leadership development",
      "leadership programme",
      "leadership program",
      "management training",
      "executive coaching",
      // Broader terms: exact "leadership training" wording barely appears on
      // ReliefWeb; capacity building/development is how this work is listed.
      "capacity building",
      "capacity development",
    ],
  },
  {
    key: "strategy",
    label: "Strategic planning",
    phrases: [
      "strategic plan",
      "strategic planning",
      "strategy development",
      "strategic review",
      // Broader single terms — the exact phrases return ~0 on ReliefWeb.
      "strategy",
      "governance",
    ],
  },
  {
    key: "education",
    label: "Education systems review",
    phrases: [
      "education sector review",
      "education system review",
      "education systems review",
      "education review",
      "curriculum review",
      "education assessment",
      "university review",
      "institutional review",
      // Broader single terms — the review-specific phrases return ~0.
      "education",
      "curriculum",
    ],
  },
];

const ALL_PHRASES = SERVICE_AREAS.flatMap((area) => area.phrases);

// A single alphanumeric token (MEAL) can go bare into a ReliefWeb query;
// anything with a space or punctuation (e.g. "M&E", "strategic plan") must be
// quoted so it's matched as a phrase, not OR-ed word by word.
function toQueryTerm(phrase: string): string {
  return /^[A-Za-z0-9]+$/.test(phrase) ? phrase : `"${phrase}"`;
}

// ReliefWeb `query[value]` string: every service phrase OR-ed together.
export function serviceKeywordQuery(): string {
  return ALL_PHRASES.map(toQueryTerm).join(" OR ");
}

// Case-insensitive substring test used to screen scrapers that return plain
// text rather than a queryable API. Used by DevNetJobs (title only) and UNDP
// (title + description) to keep those feeds focused on the service areas
// instead of returning every in-country opportunity.
export function matchesServiceArea(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return ALL_PHRASES.some((phrase) => lower.includes(phrase.toLowerCase()));
}

// The `key`s of every service area whose phrases appear in `text`. An
// opportunity can match more than one (e.g. an "M&E and capacity building"
// role). Used to filter/label opportunities by service area after scraping,
// since the matched area isn't stored on the row.
export function classifyServiceAreas(text: string | null | undefined): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return SERVICE_AREAS.filter((area) =>
    area.phrases.some((phrase) => lower.includes(phrase.toLowerCase()))
  ).map((area) => area.key);
}

// True if `text` matches the given service-area key. Convenience wrapper over
// classifyServiceAreas for single-area filtering.
export function matchesServiceAreaKey(text: string | null | undefined, key: string): boolean {
  return classifyServiceAreas(text).includes(key);
}
