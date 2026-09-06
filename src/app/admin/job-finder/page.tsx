"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, ExternalLink, Loader2, Search } from "lucide-react";
import type { JobMatch, JobSearchResult } from "@/lib/job-finder";

const STORAGE_KEY = "careercraft-private-job-finder-v1";
const DEFAULT_QUERY = "MERL, MEAL, monitoring, evaluation, research, data, programme, project";
const sourceLabels = { myjobmag: "MyJobMag Kenya", corporatestaffing: "Corporate Staffing", brightermonday: "BrighterMonday Kenya", reliefweb: "ReliefWeb" };
type SavedJob = JobMatch & { applied: boolean };
const fieldClass = "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function validSavedJob(value: unknown): value is SavedJob {
  if (!value || typeof value !== "object") return false;
  const job = value as SavedJob;
  try {
    const url = new URL(job.url);
    const expected = { myjobmag: ["www.myjobmag.co.ke", /^\/job\//], corporatestaffing: ["www.corporatestaffing.co.ke", /^\/job\//], brightermonday: ["www.brightermonday.co.ke", /^\/listings\//], reliefweb: ["reliefweb.int", /^\/(job|node)\//] } as const;
    const rule = expected[job.source];
    return url.protocol === "https:" && !!rule && url.hostname === rule[0] && rule[1].test(url.pathname) &&
      [job.title, job.employer, job.location, job.summary].every((value) => typeof value === "string") &&
      (job.deadline === null || /^\d{4}-\d{2}-\d{2}$/.test(job.deadline)) &&
      Array.isArray(job.matches) && job.matches.every((term) => typeof term === "string") && typeof job.applied === "boolean";
  } catch { return false; }
}

export default function JobFinderPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [result, setResult] = useState<JobSearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [tab, setTab] = useState<"matches" | "saved">("matches");
  const [source, setSource] = useState("all");
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Browser-only preferences are hydrated after mount, never during SSR.
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          if (typeof stored.query === "string") setQuery(stored.query.slice(0, 300));
          if (typeof stored.location === "string") setLocation(stored.location.slice(0, 80));
          if (Array.isArray(stored.saved)) setSaved(stored.saved.filter(validSavedJob).slice(0, 100));
        }
      } catch { setStorageError("Browser storage is unavailable. Your shortlist will last for this visit only."); }
      setLoaded(true);
    });
    return () => { cancelAnimationFrame(frame); requestRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ query, location, saved })); }
    catch { /* Report from a deferred callback to avoid updating during the effect. */
      const frame = requestAnimationFrame(() => setStorageError("Could not save your shortlist in this browser. Keep this page open."));
      return () => cancelAnimationFrame(frame);
    }
  }, [query, location, saved, loaded]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    setTab("matches");
    try {
      const params = new URLSearchParams({ q: query, location });
      const response = await fetch(`/api/admin/job-finder?${params}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not find jobs.");
      setResult(data);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not find jobs.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }

  const rows = (tab === "saved" ? saved : result?.jobs ?? []).filter((job) => source === "all" || job.source === source);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  return <div className="mx-auto max-w-6xl space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-brand">Your career</p><h1 className="mt-2 text-2xl font-bold">Find jobs</h1><p className="mt-2 max-w-2xl text-sm text-text-secondary">Find vacancies from MyJobMag Kenya, Corporate Staffing, BrighterMonday Kenya and ReliefWeb that mention your roles and skills. Review the requirements, then apply through the original advert.</p></div>
    <form onSubmit={search} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <label className="text-sm font-medium">Roles and skills<input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={300} required disabled={!loaded} className={fieldClass} placeholder="MERL, research, data analyst, Power BI" /><span className="mt-2 block text-xs font-normal text-text-secondary">Separate terms with commas. A vacancy can match any of your terms.</span></label>
        <label className="text-sm font-medium">Location<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} disabled={!loaded} className={fieldClass} placeholder="Any location, or Nairobi" /><span className="mt-2 block text-xs font-normal text-text-secondary">Leave blank to include adverts without a stated location.</span></label>
      </div>
      <button disabled={busy || !loaded || !query.trim()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{busy ? "Checking job adverts…" : "Find jobs"}</button>
      <p className="mt-3 text-xs text-text-secondary">Checks recent research, project management and data listings: up to 12 adverts per job board, plus 50 Kenya-related ReliefWeb vacancies. Source pages refresh every 30 minutes.</p>
    </form>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {storageError && <p role="status" className="text-sm text-amber-700">{storageError}</p>}
    {result?.warnings.map((warning) => <p key={warning} role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{warning}</p>)}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">{(["matches", "saved"] as const).map((value) => <button key={value} onClick={() => setTab(value)} aria-pressed={tab === value} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === value ? "bg-brand text-white" : "border border-border bg-card"}`}>{value === "matches" ? `Matches${result ? ` (${result.jobs.length})` : ""}` : `Shortlist (${saved.length})`}</button>)}</div>
      <label className="text-sm">Source <select value={source} onChange={(event) => setSource(event.target.value)} className="ml-2 rounded-lg border border-border bg-card p-2"><option value="all">All sources</option>{Object.entries(sourceLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    </div>
    <p className="text-xs text-text-secondary">{tab === "saved" ? "Your shortlist and application marks are saved in this browser only (up to 100 jobs)." : "Matches are based on keywords, not a guarantee of eligibility. Past deadlines are hidden; confirm availability on the advert."}{result && tab === "matches" && ` Last checked ${new Date(result.checkedAt).toLocaleString()}.`}</p>
    {busy && <p role="status" className="py-8 text-center text-sm text-text-secondary">Checking job sources and excluding past deadlines. This may take up to a minute.</p>}
    {!busy && !rows.length && <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Search className="mx-auto mb-3 h-7 w-7 text-brand" /><p className="font-medium">{tab === "saved" ? "Your shortlist is empty" : result ? "No matching jobs found in the checked adverts" : "Find your next opportunity"}</p><p className="mt-2 text-sm text-text-secondary">{tab === "saved" ? "Save jobs from your matches to review them here." : result ? "Try broader keywords, remove the location, or check again later." : "Start with the suggested terms or add the roles you want."}</p></div>}
    <div className="grid gap-4 lg:grid-cols-2">{rows.map((job) => {
      const savedJob = saved.find((item) => item.url === job.url);
      const expired = job.deadline && job.deadline < today;
      return <article key={job.url} className="flex flex-col rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-brand">{sourceLabels[job.source]}</p><h2 className="mt-2 text-lg font-semibold">{job.title}</h2><p className="mt-1 text-sm text-text-secondary">{job.employer} · {job.location}</p>
        <p className={`mt-3 text-xs font-medium ${expired ? "text-red-600" : "text-text-secondary"}`}>{job.deadline ? `${expired ? "Deadline passed" : "Deadline"}: ${job.deadline}` : "Deadline not stated — check availability"}</p>
        {job.posted && <p className="mt-1 text-xs text-text-secondary">Posted {job.posted}</p>}
        {job.summary && <p className="mt-3 text-sm leading-relaxed text-text-secondary">{job.summary}{job.summary.length >= 350 ? "…" : ""}</p>}
        <div className="my-4 flex flex-wrap gap-2">{job.matches.map((term) => <span key={term} className="rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand">{term}</span>)}</div>
        <div className="mt-auto flex flex-wrap gap-2">
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">View job &amp; apply <ExternalLink className="h-3.5 w-3.5" /></a>
          <button onClick={() => setSaved((current) => savedJob ? current.filter((item) => item.url !== job.url) : [...current, { ...job, applied: false }])} disabled={!savedJob && saved.length >= 100} aria-pressed={!!savedJob} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"><Bookmark className={`h-4 w-4 ${savedJob ? "fill-current" : ""}`} />{savedJob ? "Unsave" : "Save"}</button>
        </div>
        {savedJob && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={savedJob.applied} onChange={(event) => setSaved((current) => current.map((item) => item.url === job.url ? { ...item, applied: event.target.checked } : item))} />I have applied for this job</label>}
      </article>;
    })}</div>
  </div>;
}
