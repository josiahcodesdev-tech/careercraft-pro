const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const path = require("node:path");

// Compile this standalone server module without requiring a running Next app.
const filename = path.resolve(__dirname, "../src/lib/job-finder.ts");
const compiled = new Module(filename, module);
compiled.filename = filename;
compiled.paths = module.paths;
compiled._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { searchTerms, matchingTerms, dateOnly, kenyaToday, parseListing, parseJob, parseReliefWebJobs, findJobs } = compiled.exports;

test("matching uses complete words and phrases, deduplicates terms", () => {
  const terms = searchTerms("M&E, meal, Power BI, data, DATA");
  assert.deepEqual(matchingTerms("M&E Officer with Power BI and database skills", terms), ["m e", "power bi"]);
  assert.deepEqual(matchingTerms("Meal coordinator", terms), ["meal"]);
});

test("dates reject impossible days and use Kenya's calendar", () => {
  assert.equal(dateOnly("31/02/2026"), null);
  assert.equal(dateOnly("08/09/2026"), "2026-09-08");
  assert.equal(dateOnly("Sep 2, 2026"), "2026-09-02");
  assert.equal(dateOnly("2026-09-17T00:00:00Z"), "2026-09-17");
  assert.equal(kenyaToday(new Date("2026-09-06T22:00:00Z")), "2026-09-07");
});

test("listing links stay on the trusted source and are deduplicated", () => {
  const jobs = parseListing(`<h2><a href="/job/research?x=1">Research officer</a></h2>
    <h3><a href="/job/research">Research officer</a></h3>
    <h2><a href="https://evil.example/job/a">Research role</a></h2>
    <h2><a href="javascript:alert(1)">Bad link</a></h2>`, "myjobmag");
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].url, "https://www.myjobmag.co.ke/job/research");
});

test("corporate staffing graph metadata and dates are extracted", () => {
  const html = `<h1>Data Officer Job Example</h1><p>Job Title: Data Officer</p><p>Employer: Example</p><p>Location: Nairobi</p><p>Country: Kenya</p><p>Deadline: 08/09/2026</p>
    <script type="application/ld+json">${JSON.stringify([{ "@graph": [{ "@type": "JobPosting", title: "Data Officer", hiringOrganization: { name: "Example" }, datePosted: "2026-09-01" }] }])}</script>`;
  const job = parseJob(html, "corporatestaffing", "https://www.corporatestaffing.co.ke/job/example/");
  assert.equal(job.title, "Data Officer");
  assert.equal(job.employer, "Example");
  assert.equal(job.location, "Nairobi");
  assert.equal(job.deadline, "2026-09-08");
});

test("invalid JSON falls back to visible metadata and does not invent a deadline", () => {
  const job = parseJob(`<h1>Research Officer at Example</h1><div>Deadline: Not specified</div><ul><li>Location Nairobi</li></ul><script type="application/ld+json">invalid</script>`, "myjobmag", "https://www.myjobmag.co.ke/job/example");
  assert.equal(job.employer, "Example");
  assert.equal(job.location, "Nairobi");
  assert.equal(job.deadline, null);
  assert.equal(parseJob("<h1>Research Officer at Example</h1><p>Oops! It seems this job from Example has expired</p>", "myjobmag", "https://www.myjobmag.co.ke/job/example").closed, true);
  assert.equal(parseJob("<h1>Access denied</h1>", "myjobmag", "https://www.myjobmag.co.ke/job/example"), null);
});

test("BrighterMonday card selectors and schema references resolve correctly", () => {
  const listing = parseListing(`<div data-cy="listing-cards-components"><a data-cy="listing-title-link" href="/listings/research-123">Research Officer</a><p>Programme data analysis</p></div>`, "brightermonday");
  assert.equal(listing[0].url, "https://www.brightermonday.co.ke/listings/research-123");
  assert.match(listing[0].snippet, /data analysis/);
  const html = `<h1>Research Officer</h1><p>Job applications are closed.</p><script type="application/ld+json">${JSON.stringify({ "@graph": [
    { "@type": "JobPosting", title: "Research Officer", hiringOrganization: { "@id": "#employer" }, jobLocation: { "@id": "#location", address: { addressCountry: "KE" } }, validThrough: "2026-09-10" },
    { "@type": "Organization", "@id": "#employer", name: "Example NGO" },
    { "@type": "Place", "@id": "#location", address: { "@id": "#address" } },
    { "@type": "PostalAddress", "@id": "#address", addressLocality: "Nairobi" },
  ] })}</script>`;
  const job = parseJob(html, "brightermonday", listing[0].url);
  assert.equal(job.employer, "Example NGO");
  assert.equal(job.location, "Nairobi");
  assert.equal(job.closed, true);
  const visibleCity = parseJob(html.replace("<h1>", '<a rel="nofollow" href="/jobs/research/mombasa?industry=ngo">Mombasa</a><h1>'), "brightermonday", listing[0].url);
  assert.equal(visibleCity.location, "Mombasa");
});

test("ReliefWeb filters expired and unrelated jobs, rejects unsafe URLs", () => {
  const fields = { title: "Research Officer", url: "https://reliefweb.int/node/123", body: "Research and data collection", city: [{ name: "Nairobi" }], country: [{ name: "Kenya" }], source: [{ name: "Example NGO" }], date: { closing: "2026-09-09T00:00:00Z", created: "2026-09-01T12:00:00Z" } };
  const payload = { data: [{ fields }, { fields: { ...fields, date: { closing: "2026-08-01" } } }, { fields: { ...fields, url: "https://evil.example/job/123" } }, { fields: { ...fields, title: "Driver", body: "Driving duties" } }] };
  const jobs = parseReliefWebJobs(payload, ["research"], "Nairobi", "2026-09-06");
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].source, "reliefweb");
  assert.equal(jobs[0].employer, "Example NGO");
  assert.equal(jobs[0].deadline, "2026-09-09");
  assert.equal(parseReliefWebJobs(payload, ["research"], "Mombasa", "2026-09-06").length, 0);
  assert.throws(() => parseReliefWebJobs({ error: "API unavailable" }, ["research"], "", "2026-09-06"));
});

test("search excludes expired vacancies, keeps unknown deadlines, and reports source failures", async () => {
  const original = global.fetch;
  global.fetch = async (url) => {
    if (url.includes("corporatestaffing")) throw new Error("Unavailable");
    if (!url.includes("/job/")) return new Response(`<h2><a href="/job/expired">Research officer</a></h2><h2><a href="/job/unknown">Research assistant</a></h2>`);
    return new Response(`<h1>Research Officer at Example</h1><div>Deadline: ${url.includes("expired") ? "01/01/2000" : "Not specified"}</div><li>Location Nairobi</li>`);
  };
  try {
    const result = await findJobs("research", "Nairobi");
    assert.equal(result.jobs.length, 1);
    assert.ok(result.jobs[0].url.endsWith("/unknown"));
    assert.ok(result.warnings.some((warning) => warning.includes("corporatestaffing")));
  } finally { global.fetch = original; }
});
