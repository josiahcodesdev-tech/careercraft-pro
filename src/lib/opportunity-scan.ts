import { upsertOpportunities } from "@/lib/opportunities";
import { fetchReliefWebJobs } from "@/lib/scrapers/reliefweb";
import { fetchDevNetJobsRfps } from "@/lib/scrapers/devnetjobs";

export interface ScanSummary {
  startedAt: string;
  finishedAt: string;
  reliefweb: { fetched: number; error?: string };
  devnetjobs: { fetched: number; error?: string };
  upserted: number;
}

export async function runOpportunityScan(): Promise<ScanSummary> {
  const startedAt = new Date().toISOString();

  const [reliefweb, devnetjobs] = await Promise.all([fetchReliefWebJobs(), fetchDevNetJobsRfps()]);

  if (reliefweb.error) console.error("[opportunities] reliefweb scrape failed:", reliefweb.error);
  if (devnetjobs.error) console.error("[opportunities] devnetjobs scrape failed:", devnetjobs.error);

  const allDrafts = [...reliefweb.drafts, ...devnetjobs.drafts];
  const upserted = await upsertOpportunities(allDrafts);

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    reliefweb: { fetched: reliefweb.drafts.length, error: reliefweb.error },
    devnetjobs: { fetched: devnetjobs.drafts.length, error: devnetjobs.error },
    upserted,
  };
}
