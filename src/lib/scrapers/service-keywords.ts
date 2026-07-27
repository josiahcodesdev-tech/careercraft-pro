// Program-category taxonomy for tagging inbound leads/RFPs, per the CareerCraft
// / VASOL Lead Categorization config. Centralised here so everything shares one
// definition of "relevant": ReliefWeb turns these into an API full-text query,
// the scrapers screen plain-text feeds (DevNetJobs, UNDP) against them, and the
// dashboard + public API classify each opportunity into one or more categories.
//
// Each category carries `primary` and `secondary` keyword lists (kept separate
// so the periodic feedback-loop review can tighten noisy categories or broaden
// under-matching ones independently). Matching is a case-insensitive substring
// test over both lists combined, against title + organization/description. An
// opportunity can match several categories; none → "Uncategorized".
export interface ServiceArea {
  key: string;
  label: string;
  primary: string[];
  secondary: string[];
}

export const UNCATEGORIZED = "Uncategorized";

export const SERVICE_AREAS: ServiceArea[] = [
  {
    key: "me",
    label: "M&E",
    // The ampersand/plus spellings ("Monitoring & Evaluation", "M+E") are how
    // ReliefWeb's token search actually returns these, so keep them alongside
    // the canonical wording or genuine M&E leads slip through unclassified.
    primary: ["M&E", "M & E", "M+E", "monitoring and evaluation", "monitoring & evaluation", "monitoring, evaluation", "MEAL", "MEL framework"],
    secondary: ["baseline evaluation", "endline evaluation", "impact assessment", "impact evaluation", "results measurement"],
  },
  {
    key: "leadership_governance",
    label: "Leadership & Governance",
    primary: ["leadership development", "governance training", "leadership training"],
    secondary: ["senior management capacity", "leadership capacity building", "management training", "executive coaching"],
  },
  {
    key: "project_management",
    label: "Project Management",
    primary: ["project management training", "PMP"],
    secondary: ["project cycle management"],
  },
  {
    key: "digital_skills",
    label: "Digital Skills",
    primary: ["digital skills training", "data analysis training"],
    secondary: ["digital transformation", "digital literacy"],
  },
  {
    key: "proposal_writing",
    label: "Proposal Writing",
    primary: ["proposal writing training", "grant writing", "proposal writing"],
    secondary: ["resource mobilization training", "resource mobilisation"],
  },
  {
    key: "capacity_building",
    label: "Capacity Building (broad)",
    primary: ["institutional capacity building", "organizational development", "organisational development", "capacity building"],
    secondary: ["capacity strengthening", "capacity development"],
  },
  {
    key: "performance_systems",
    label: "Performance Systems",
    primary: ["performance management system", "360 feedback"],
    secondary: ["HR systems capacity building", "performance appraisal"],
  },
];

// key -> human label, plus the Uncategorized fallback, for UI/API rendering.
export const SERVICE_AREA_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_AREAS.map((a) => [a.key, a.label])
);

function phrasesOf(area: ServiceArea): string[] {
  return [...area.primary, ...area.secondary];
}

const ALL_PHRASES = SERVICE_AREAS.flatMap(phrasesOf);

// A single alphanumeric token (PMP) can go bare into a ReliefWeb query; anything
// with a space or punctuation (e.g. "M&E", "360 feedback") must be quoted so
// it's matched as a phrase, not OR-ed word by word.
function toQueryTerm(phrase: string): string {
  return /^[A-Za-z0-9]+$/.test(phrase) ? phrase : `"${phrase}"`;
}

// ReliefWeb `query[value]` string: every category keyword OR-ed together.
export function serviceKeywordQuery(): string {
  return ALL_PHRASES.map(toQueryTerm).join(" OR ");
}

// Case-insensitive substring test used to screen scrapers that return plain
// text rather than a queryable API (DevNetJobs on title, UNDP on title +
// description), keeping those feeds focused on the program categories.
export function matchesServiceArea(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return ALL_PHRASES.some((phrase) => lower.includes(phrase.toLowerCase()));
}

// The `key`s of every category whose keywords appear in `text` — an opportunity
// can match more than one. Empty array means Uncategorized (no keyword hit).
export function classifyServiceAreas(text: string | null | undefined): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return SERVICE_AREAS.filter((area) =>
    phrasesOf(area).some((phrase) => lower.includes(phrase.toLowerCase()))
  ).map((area) => area.key);
}

// Human-readable category labels for `text`, or ["Uncategorized"] if nothing
// matched — the shape the daily digest and public API present.
export function categoryLabels(text: string | null | undefined): string[] {
  const keys = classifyServiceAreas(text);
  return keys.length > 0 ? keys.map((k) => SERVICE_AREA_LABELS[k]) : [UNCATEGORIZED];
}

// True if `text` matches the given category key. Convenience wrapper over
// classifyServiceAreas for single-category filtering.
export function matchesServiceAreaKey(text: string | null | undefined, key: string): boolean {
  return classifyServiceAreas(text).includes(key);
}
