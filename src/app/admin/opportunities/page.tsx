"use client";

import { useCallback, useEffect, useState } from "react";
import { type Opportunity, type OpportunityStatus, isKenyaLocation } from "@/lib/opportunities";
import { SERVICE_AREAS, classifyServiceAreas, categoryLabels } from "@/lib/scrapers/service-keywords";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Radar, Inbox, FileText, Briefcase, Loader2, RefreshCw, Power, Download } from "lucide-react";

const selectClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors";

// Human-friendly names for the scraper each opportunity came from. Falls back
// to the raw source key if a new scraper is added before this map is updated.
const SOURCE_LABELS: Record<string, string> = {
  reliefweb: "ReliefWeb",
  devnetjobs: "DevNetJobs",
  undp: "UNDP",
};

// RFC-4180 field escaping: wrap in quotes if the value has a comma, quote or
// newline, doubling any inner quotes.
function csvCell(value: string | null | undefined): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportOpportunitiesCsv(rows: Opportunity[]) {
  const headers = ["Title", "Organization", "Source", "Category", "Program areas", "Location", "Deadline", "Scraped", "Status", "URL"];
  const lines = [headers.join(",")];
  for (const it of rows) {
    lines.push(
      [
        it.title,
        it.organization ?? "",
        SOURCE_LABELS[it.source] ?? it.source,
        it.category === "rfp" ? "RFP" : "Job",
        categoryLabels(`${it.title} ${it.organization ?? ""}`).join("; "),
        it.location ?? "",
        it.deadline ?? "",
        it.firstSeenAt ? it.firstSeenAt.slice(0, 10) : "",
        it.status,
        it.sourceUrl,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  // Prepend a BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `opportunities_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Counts {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [lastScan, setLastScan] = useState<{ at: string | null; seenCount: number; newCount: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanEnabled, setScanEnabledState] = useState<boolean | null>(null);
  const [togglingScan, setTogglingScan] = useState(false);

  useEffect(() => {
    fetch("/api/admin/opportunities/settings")
      .then((res) => res.json())
      .then((json) => setScanEnabledState(json.enabled ?? true))
      .catch(() => setScanEnabledState(true));
  }, []);

  async function handleToggleScan() {
    if (scanEnabled === null) return;
    const next = !scanEnabled;
    setTogglingScan(true);
    try {
      const res = await fetch("/api/admin/opportunities/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const json = await res.json();
      if (res.ok) setScanEnabledState(json.enabled);
    } catch {
      // leave state as-is; user can retry
    }
    setTogglingScan(false);
  }

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);

    fetch(`/api/admin/opportunities?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setItems(json.data ?? []);
        setCounts(json.counts ?? null);
        setLastScan(json.lastScan ?? null);
      })
      .catch(() => {
        setItems([]);
        setCounts(null);
        setLastScan(null);
      });
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleScanNow() {
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch("/api/admin/opportunities", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setScanMessage(json.error ?? "Scan failed.");
      } else if (json.skipped) {
        setScanMessage("Scraping is turned off — turn it back on to run a scan.");
      } else {
        const rw = json.reliefweb;
        const dn = json.devnetjobs;
        const un = json.undp;
        const parts = [
          `ReliefWeb: ${rw.fetched} fetched${rw.error ? ` (${rw.error})` : ""}`,
          `DevNetJobs: ${dn.fetched} fetched${dn.error ? ` (${dn.error})` : ""}`,
          `UNDP: ${un.fetched} fetched${un.error ? ` (${un.error})` : ""}`,
        ];
        setScanMessage(parts.join(" · "));
        load();
      }
    } catch {
      setScanMessage("Scan failed. Check your connection and try again.");
    }
    setScanning(false);
  }

  async function handleStatusChange(id: string, status: OpportunityStatus) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      await fetch(`/api/admin/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      load();
    }
  }

  // Service area (derived from title + organization) and the scraped-date range
  // are both filtered client-side over the already-loaded items. The date range
  // compares the scraped date (firstSeenAt), and the export uses this same
  // filtered set, so "filter by date" applies to the CSV too.
  const visibleItems = items
    .filter((it) => {
      if (areaFilter !== "all") {
        const cats = classifyServiceAreas(`${it.title} ${it.organization ?? ""}`);
        // "uncategorized" = no keyword hit; otherwise must contain the key.
        if (areaFilter === "uncategorized" ? cats.length > 0 : !cats.includes(areaFilter)) {
          return false;
        }
      }
      const scraped = it.firstSeenAt ? it.firstSeenAt.slice(0, 10) : "";
      if (fromDate && (!scraped || scraped < fromDate)) return false;
      if (toDate && (!scraped || scraped > toDate)) return false;
      return true;
    })
    // Kenya-based leads to the top (accreditation edge), preserving newest-first
    // order within each group — V8's sort is stable.
    .sort((a, b) => Number(isKenyaLocation(b.location)) - Number(isKenyaLocation(a.location)));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 min-w-[280px]">
          <StatCard
            title="Total"
            value={counts?.total ?? 0}
            icon={Radar}
            gradient="bg-gradient-to-br from-[#2E7D52] to-[#1A5C3A]"
          />
          <StatCard
            title="New"
            value={counts?.byStatus.new ?? 0}
            icon={Inbox}
            gradient="bg-gradient-to-br from-[#D4A017] to-[#B8860B]"
          />
          <StatCard
            title="RFPs / Tenders"
            value={counts?.byCategory.rfp ?? 0}
            icon={FileText}
            gradient="bg-gradient-to-br from-[#2a78d6] to-[#1d5a9e]"
          />
          <StatCard
            title="Jobs"
            value={counts?.byCategory.job ?? 0}
            icon={Briefcase}
            gradient="bg-gradient-to-br from-[#7b4fc9] to-[#5c3a9e]"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleToggleScan}
            disabled={scanEnabled === null || togglingScan}
            className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              scanEnabled
                ? "bg-brand-light text-brand hover:bg-brand/20"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            {togglingScan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            Scraping: {scanEnabled === null ? "…" : scanEnabled ? "On" : "Off"}
          </button>
          <button
            onClick={handleScanNow}
            disabled={scanning || !scanEnabled}
            title={scanEnabled === false ? "Scraping is turned off" : undefined}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand hover:bg-brand-mid text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Scan now
          </button>
        </div>
      </div>

      {lastScan?.at && (
        <p className="text-xs text-text-muted -mt-2">
          Last scraped:{" "}
          <span className="font-medium text-text-secondary">
            {new Date(lastScan.at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>{" "}
          · {lastScan.seenCount} opportunit{lastScan.seenCount === 1 ? "y" : "ies"} seen
          {lastScan.newCount > 0 ? ` · ${lastScan.newCount} new` : ""}
        </p>
      )}

      {scanEnabled === false && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          Scraping is turned off. The daily automatic scan and manual scans are both paused until you turn it back on.
        </div>
      )}

      {scanMessage && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-secondary">
          {scanMessage}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="applied">Applied</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
            <option value="all">All categories</option>
            <option value="rfp">RFPs / Tenders</option>
            <option value="job">Jobs</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Program area</label>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className={selectClass}>
            <option value="all">All programs</option>
            {SERVICE_AREAS.map((area) => (
              <option key={area.key} value={area.key}>
                {area.label}
              </option>
            ))}
            <option value="uncategorized">Uncategorized</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Scraped from</label>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} className={selectClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Scraped to</label>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} className={selectClass} />
        </div>
        <button
          onClick={() => exportOpportunitiesCsv(visibleItems)}
          disabled={visibleItems.length === 0}
          className="ml-auto inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand hover:bg-brand-mid text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          <Download className="w-4 h-4" /> Export CSV ({visibleItems.length})
        </button>
      </div>

      <DataTable
        columns={[
          {
            key: "title",
            header: "Title",
            render: (item: Opportunity) => (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline font-medium"
              >
                {item.title}
              </a>
            ),
          },
          {
            key: "organization",
            header: "Organization",
            render: (item: Opportunity) => item.organization || "—",
          },
          {
            key: "source",
            header: "Source",
            render: (item: Opportunity) => (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-background border border-border text-text-secondary">
                {SOURCE_LABELS[item.source] ?? item.source}
              </span>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (item: Opportunity) => (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-light text-brand uppercase">
                {item.category === "rfp" ? "RFP" : "Job"}
              </span>
            ),
          },
          {
            key: "programs",
            header: "Program areas",
            render: (item: Opportunity) => {
              const labels = categoryLabels(`${item.title} ${item.organization ?? ""}`);
              const uncategorized = labels[0] === "Uncategorized";
              return (
                <div className="flex flex-wrap gap-1 max-w-[220px]">
                  {labels.map((l) => (
                    <span
                      key={l}
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        uncategorized
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-background border border-border text-text-secondary"
                      }`}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              );
            },
          },
          {
            key: "location",
            header: "Location",
            render: (item: Opportunity) =>
              item.location ? (
                <span className="whitespace-nowrap">
                  {isKenyaLocation(item.location) && (
                    <span className="mr-1 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand text-white align-middle">KE</span>
                  )}
                  {item.location}
                </span>
              ) : (
                "—"
              ),
          },
          {
            key: "deadline",
            header: "Deadline",
            render: (item: Opportunity) =>
              item.deadline
                ? new Date(item.deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "—",
          },
          {
            key: "scraped",
            header: "Scraped",
            render: (item: Opportunity) => (
              <span className="text-text-secondary whitespace-nowrap">
                {new Date(item.firstSeenAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item: Opportunity) => (
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value as OpportunityStatus)}
                className={selectClass}
              >
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="applied">Applied</option>
                <option value="ignored">Ignored</option>
              </select>
            ),
          },
        ]}
        data={visibleItems}
        emptyMessage="No opportunities found yet. Run a scan or check back after the next daily scrape."
      />
    </div>
  );
}
