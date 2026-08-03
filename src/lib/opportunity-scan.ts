import { upsertOpportunities, getScanEnabled, type OpportunityDraft } from "@/lib/opportunities";
import { fetchReliefWebJobs } from "@/lib/scrapers/reliefweb";
import { fetchDevNetJobsRfps } from "@/lib/scrapers/devnetjobs";
import { fetchUndpProcurementNotices } from "@/lib/scrapers/undp";
import { fetchWorldBankNotices } from "@/lib/scrapers/worldbank";
import { fetchUngmNotices } from "@/lib/scrapers/ungm";

export interface SourceResult {
  fetched: number;
  error?: string;
}

export interface ScanSummary {
  startedAt: string;
  finishedAt: string;
  skipped?: boolean;
  /** Keyed by source id, so adding a scraper needs no change here or in the UI. */
  sources: Record<string, SourceResult>;
  upserted: number;
}

/**
 * Every source the daily scan pulls from.
 *
 * Keyed by the same id the scrapers write into `OpportunityDraft.source`, so
 * the per-source counts in the summary line up with the Source column in the
 * admin table.
 */
const SCRAPERS: Record<string, () => Promise<{ drafts: OpportunityDraft[]; error?: string }>> = {
  reliefweb: fetchReliefWebJobs,
  devnetjobs: fetchDevNetJobsRfps,
  undp: fetchUndpProcurementNotices,
  worldbank: fetchWorldBankNotices,
  ungm: fetchUngmNotices,
};

export const SCAN_SOURCE_IDS = Object.keys(SCRAPERS);

export async function runOpportunityScan(): Promise<ScanSummary> {
  const startedAt = new Date().toISOString();

  const empty = (): Record<string, SourceResult> =>
    Object.fromEntries(SCAN_SOURCE_IDS.map((id) => [id, { fetched: 0 }]));

  // One switch pauses both the daily cron and the manual "Scan now" button —
  // simpler mental model than having independent on/off states for each.
  if (!(await getScanEnabled())) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      skipped: true,
      sources: empty(),
      upserted: 0,
    };
  }

  const entries = Object.entries(SCRAPERS);
  const results = await Promise.all(
    entries.map(async ([id, run]) => {
      // A scraper that throws outright must not take the others down with it —
      // one broken source should cost that source, not the whole morning's scan.
      try {
        return [id, await run()] as const;
      } catch (e) {
        return [
          id,
          { drafts: [], error: e instanceof Error ? e.message : `${id} scrape threw` },
        ] as const;
      }
    }),
  );

  const sources: Record<string, SourceResult> = {};
  const allDrafts: OpportunityDraft[] = [];

  for (const [id, result] of results) {
    if (result.error) console.error(`[opportunities] ${id} scrape failed:`, result.error);
    sources[id] = { fetched: result.drafts.length, error: result.error };
    allDrafts.push(...result.drafts);
  }

  const upserted = await upsertOpportunities(allDrafts);

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    sources,
    upserted,
  };
}
