import { upsertOpportunities, getScanEnabled } from "@/lib/opportunities";
import { fetchReliefWebJobs } from "@/lib/scrapers/reliefweb";
import { fetchDevNetJobsRfps } from "@/lib/scrapers/devnetjobs";
import { fetchUndpProcurementNotices } from "@/lib/scrapers/undp";

export interface ScanSummary {
  startedAt: string;
  finishedAt: string;
  skipped?: boolean;
  reliefweb: { fetched: number; error?: string };
  devnetjobs: { fetched: number; error?: string };
  undp: { fetched: number; error?: string };
  upserted: number;
}

export async function runOpportunityScan(): Promise<ScanSummary> {
  const startedAt = new Date().toISOString();

  // One switch pauses both the daily cron and the manual "Scan now" button —
  // simpler mental model than having independent on/off states for each.
  if (!(await getScanEnabled())) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      skipped: true,
      reliefweb: { fetched: 0 },
      devnetjobs: { fetched: 0 },
      undp: { fetched: 0 },
      upserted: 0,
    };
  }

  const [reliefweb, devnetjobs, undp] = await Promise.all([
    fetchReliefWebJobs(),
    fetchDevNetJobsRfps(),
    fetchUndpProcurementNotices(),
  ]);

  if (reliefweb.error) console.error("[opportunities] reliefweb scrape failed:", reliefweb.error);
  if (devnetjobs.error) console.error("[opportunities] devnetjobs scrape failed:", devnetjobs.error);
  if (undp.error) console.error("[opportunities] undp scrape failed:", undp.error);

  const allDrafts = [...reliefweb.drafts, ...devnetjobs.drafts, ...undp.drafts];
  const upserted = await upsertOpportunities(allDrafts);

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    reliefweb: { fetched: reliefweb.drafts.length, error: reliefweb.error },
    devnetjobs: { fetched: devnetjobs.drafts.length, error: devnetjobs.error },
    undp: { fetched: undp.drafts.length, error: undp.error },
    upserted,
  };
}
