import * as cheerio from "cheerio";

export type JobSource = "myjobmag" | "corporatestaffing" | "brightermonday" | "reliefweb";
type HtmlJobSource = Exclude<JobSource, "reliefweb">;
export interface JobMatch {
  url: string;
  source: JobSource;
  title: string;
  employer: string;
  location: string;
  deadline: string | null;
  posted: string | null;
  summary: string;
  matches: string[];
  closed?: boolean;
}
export interface JobSearchResult {
  jobs: JobMatch[];
  checkedAt: string;
  warnings: string[];
}

const SOURCES = {
  myjobmag: {
    origin: "https://www.myjobmag.co.ke",
    pages: ["/jobs-by-date/this-month", "/jobs-by-title/monitoring-evaluation", "/jobs-by-title/research"],
  },
  corporatestaffing: {
    origin: "https://www.corporatestaffing.co.ke",
    pages: ["/jobs/", "/category/project-management-jobs-in-kenya/", "/category/data-analyst-jobs-in-kenya/"],
  },
  brightermonday: {
    origin: "https://www.brightermonday.co.ke",
    pages: ["/jobs/product-project-management", "/jobs/software-data", "/jobs/research-teaching-training"],
  },
};

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const normalise = (text: string) => clean(text.toLowerCase().replace(/[^a-z0-9]+/g, " "));

export function searchTerms(query: string): string[] {
  return [...new Set(query.split(",").map(normalise).filter((term) => term.length >= 2))].slice(0, 15);
}

export function matchingTerms(text: string, terms: string[]): string[] {
  const haystack = ` ${normalise(text)} `;
  return terms.filter((term) => haystack.includes(` ${term} `));
}

export function dateOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const local = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const named = value.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  const month = named ? ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(named[1].slice(0, 3).toLowerCase()) + 1 : 0;
  const candidate = iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : local ? `${local[3]}-${local[2]}-${local[1]}` : named && month ? `${named[3]}-${String(month).padStart(2, "0")}-${named[2].padStart(2, "0")}` : null;
  if (!candidate) return null;
  const date = new Date(`${candidate}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === candidate ? candidate : null;
}

export function kenyaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function parseListing(html: string, source: HtmlJobSource): { url: string; title: string; snippet: string }[] {
  const $ = cheerio.load(html);
  const found = new Map<string, { url: string; title: string; snippet: string }>();
  $(source === "brightermonday" ? 'a[data-cy="listing-title-link"][href]' : "h2 a[href], h3 a[href]").each((_, el) => {
    try {
      const url = new URL($(el).attr("href")!, SOURCES[source].origin);
      if (url.origin !== SOURCES[source].origin || !url.pathname.startsWith(source === "brightermonday" ? "/listings/" : "/job/")) return;
      url.search = "";
      url.hash = "";
      const title = clean($(el).text());
      if (!title) return;
      const container = $(el).closest('article, li.job-list, li.job-info, [data-cy="listing-cards-components"]');
      found.set(url.href, { url: url.href, title, snippet: clean(container.text()).slice(0, 1800) });
    } catch { /* Ignore malformed links, never fetch outside the source. */ }
  });
  return [...found.values()];
}

function jobPosting(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) { const found = jobPosting(item); if (found) return found; }
  } else if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    if ([item["@type"]].flat().includes("JobPosting")) return item;
    if (item["@graph"]) return jobPosting(item["@graph"]);
  }
  return null;
}

export function parseJob(html: string, source: HtmlJobSource, url: string): JobMatch | null {
  const $ = cheerio.load(html);
  let metadata: Record<string, unknown> = {};
  const nodes: Record<string, unknown>[] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") {
      const node = value as Record<string, unknown>;
      nodes.push(node);
      if (node["@graph"]) collect(node["@graph"]);
    }
  };
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      collect(json);
      metadata = jobPosting(json) ?? metadata;
    } catch { /* Some adverts contain invalid JSON. Use visible fields instead. */ }
  });
  const resolve = (value: unknown): Record<string, unknown> => {
    const item = Array.isArray(value) ? value[0] : value;
    if (!item || typeof item !== "object") return {};
    const record = item as Record<string, unknown>;
    const referenced = nodes.find((node) => record["@id"] && node["@id"] === record["@id"]);
    const resolved = { ...referenced, ...record };
    if (referenced?.address && typeof referenced.address === "object" && record.address && typeof record.address === "object") {
      resolved.address = { ...referenced.address, ...record.address };
    }
    return resolved;
  };
  $("script, style, nav, footer").remove();
  const body = clean($("body").text());
  const label = (name: string) => body.match(new RegExp(`${name}:\\s*(.*?)(?=(?:Job Title|Date Posted|Job Type|Job Level|Employer|Industry|Salary|Location|Country|Deadline):|$)`, "i"))?.[1]?.trim() ?? "";
  const visibleDeadline = body.match(/Deadline:\s*(Not specified|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,}\s+\d{1,2},?\s+\d{4})/i)?.[1];
  // Explicit visible "Not specified" beats inferred dates in search metadata.
  const deadline = visibleDeadline?.toLowerCase() === "not specified" ? null : dateOnly(visibleDeadline) ?? dateOnly(metadata.validThrough);
  const heading = clean($("h1").first().text());
  const title = source === "corporatestaffing" && label("Job Title") ? label("Job Title") : typeof metadata.title === "string" ? clean(cheerio.load(metadata.title).text()) : heading.replace(/\s+at\s+.*$/, "");
  if (!title || !heading || /access denied|just a moment|not found/i.test(heading)) return null;
  const employer = resolve(metadata.hiringOrganization) as { name?: string };
  const address = resolve(resolve(metadata.jobLocation).address) as { addressLocality?: string; addressRegion?: string; addressCountry?: string };
  const visibleLocation = $("li").map((_, el) => clean($(el).text())).get().find((text) => /^Location\s/.test(text))?.replace(/^Location\s+/, "");
  const brighterMondayLocation = source === "brightermonday" ? clean($('a[rel~="nofollow"][href^="/jobs/"]').filter((_, el) => /^\/jobs\/[^/?]+\/[^/?]+(?:\?|$)/.test($(el).attr("href") ?? "")).first().text()) : "";
  const paragraphs = $(source === "myjobmag" ? ".job-details p, .read p" : "article .entry-content p, article p").map((_, el) => clean($(el).text())).get().filter((text) => text.length > 90 && !/customis|customiz|recruitment process|before you apply/i.test(text));
  const description = typeof metadata.description === "string" ? clean(cheerio.load(cheerio.load(metadata.description).text()).text()) : "";
  return {
    url, source, title,
    employer: employer?.name || (source === "corporatestaffing" ? label("Employer") : heading.split(/\s+at\s+/).slice(1).join(" at ")) || "Employer not stated",
    location: brighterMondayLocation || (source === "corporatestaffing" ? label("Location") : visibleLocation) || address.addressLocality || address.addressRegion || "Location not stated",
    deadline,
    posted: dateOnly(metadata.datePosted) || dateOnly(label("Date Posted")) || dateOnly(body.match(/Posted:\s*([A-Za-z]{3,}\s+\d{1,2},?\s+\d{4})/i)?.[1]),
    summary: (paragraphs[0] || description).slice(0, 350),
    matches: [],
    closed: /it seems this job.{0,200}has expired|job applications are closed|this job role is not currently accepting applications/i.test(body),
  };
}

export function parseReliefWebJobs(payload: unknown, terms: string[], location: string, today: string): JobMatch[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) throw new Error("ReliefWeb returned an unexpected response");
  const names = (value: unknown): string => Array.isArray(value) ? value.map((item) => item && typeof item.name === "string" ? item.name : "").filter(Boolean).join(", ") : "";
  const jobs: JobMatch[] = [];
  for (const item of (payload as { data: { fields?: Record<string, unknown> }[] }).data) {
    const fields = item?.fields;
    if (!fields || typeof fields.title !== "string" || typeof fields.url !== "string") continue;
    try {
      const url = new URL(fields.url);
      if (url.origin !== "https://reliefweb.int" || !/^\/(job|node)\//.test(url.pathname)) continue;
    } catch { continue; }
    const dates = fields.date as { closing?: string; created?: string } | undefined;
    const deadline = dateOnly(dates?.closing);
    if (deadline && deadline < today) continue;
    const jobLocation = [names(fields.city), names(fields.country)].filter(Boolean).join(", ");
    if (location && !normalise(jobLocation).includes(normalise(location))) continue;
    const description = typeof fields.body === "string" ? clean(cheerio.load(fields.body).text().replace(/[#*_`]/g, "")) : "";
    const matches = matchingTerms(`${fields.title} ${description}`, terms);
    if (!matches.length) continue;
    jobs.push({ url: fields.url, source: "reliefweb", title: clean(fields.title), employer: names(fields.source) || "Employer not stated", location: jobLocation || "Location not stated", deadline, posted: dateOnly(dates?.created), summary: description.slice(0, 350), matches });
  }
  return jobs;
}

async function reliefWebJobs(terms: string[], location: string, today: string, signal: AbortSignal, warnings: string[]): Promise<JobMatch[]> {
  const appname = process.env.RELIEFWEB_APPNAME;
  if (!appname) { warnings.push("ReliefWeb is unavailable until an approved RELIEFWEB_APPNAME is configured."); return []; }
  const url = new URL("https://api.reliefweb.int/v2/jobs");
  url.searchParams.set("appname", appname);
  url.searchParams.set("query[value]", terms.map((term) => `"${term}"`).join(" OR "));
  url.searchParams.set("filter[field]", "country.iso3");
  url.searchParams.set("filter[value]", "ken");
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort[]", "date.created:desc");
  for (const field of ["title", "url", "source.name", "country.name", "city.name", "date.closing", "date.created", "body"]) url.searchParams.append("fields[include][]", field);
  try {
    return parseReliefWebJobs(JSON.parse(await fetchPage(url.href, signal)), terms, location, today);
  } catch { warnings.push("ReliefWeb: the jobs API could not be checked. Other sources are still shown."); return []; }
}

async function fetchPage(url: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "CareerCraftJobFinder/1.0" },
    redirect: "error",
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    next: { revalidate: 1800 },
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  const html = await response.text();
  if (html.length > 3_000_000) throw new Error("Source page too large");
  return html;
}

export async function findJobs(query: string, location: string): Promise<JobSearchResult> {
  const terms = searchTerms(query);
  const signal = AbortSignal.timeout(45000);
  const warnings: string[] = [];
  const today = kenyaToday();
  const results = await Promise.allSettled([...Object.entries(SOURCES).map(async ([id, config]) => {
    const source = id as HtmlJobSource;
    const pages = await Promise.allSettled(config.pages.map(async (path) => parseListing(await fetchPage(config.origin + path, signal), source)));
    const candidates = new Map<string, { url: string; title: string; snippet: string }>();
    for (const page of pages) if (page.status === "fulfilled") for (const item of page.value) candidates.set(item.url, item);
    if (pages.some((page) => page.status === "rejected")) warnings.push(`${id}: some listing pages could not be checked.`);
    if (!candidates.size) { warnings.push(`${id}: no adverts could be read. Try again later.`); return []; }
    const selected = [...candidates.values()]
      .filter((item) => matchingTerms(`${item.title} ${item.snippet}`, terms).length)
      .sort((a, b) => matchingTerms(b.title, terms).length - matchingTerms(a.title, terms).length).slice(0, 12);
    const jobs: JobMatch[] = [];
    let failures = 0;
    for (let i = 0; i < selected.length; i += 4) {
      const batch = await Promise.allSettled(selected.slice(i, i + 4).map(async (item) => {
        const job = parseJob(await fetchPage(item.url, signal), source, item.url);
        if (!job) throw new Error("Unreadable advert");
        if (job.closed || (job.deadline && job.deadline < today)) return null;
        if (location && !normalise(job.location).includes(normalise(location))) return null;
        job.matches = matchingTerms(`${job.title} ${job.summary}`, terms);
        return job.matches.length ? job : null;
      }));
      for (const result of batch) {
        if (result.status === "fulfilled" && result.value) jobs.push(result.value);
        else if (result.status === "rejected") failures++;
      }
    }
    if (failures) warnings.push(`${id}: ${failures} adverts could not be checked.`);
    return jobs;
  }), reliefWebJobs(terms, location, today, signal, warnings)]);
  const jobs: JobMatch[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") jobs.push(...result.value);
    else warnings.push("A job source is temporarily unavailable.");
  }
  // The same vacancy is often syndicated on both boards.
  const unique = new Map<string, JobMatch>();
  for (const job of jobs) {
    const key = `${normalise(job.title)}|${normalise(job.employer)}|${normalise(job.location)}`;
    if (!unique.has(key)) unique.set(key, job);
  }
  return { jobs: [...unique.values()].sort((a, b) => b.matches.length - a.matches.length || (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")), checkedAt: new Date().toISOString(), warnings };
}
