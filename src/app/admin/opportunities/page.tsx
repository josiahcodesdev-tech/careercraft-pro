"use client";

import { useCallback, useEffect, useState } from "react";
import { type Opportunity, type OpportunityStatus } from "@/lib/opportunities";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Radar, Inbox, FileText, Briefcase, Loader2, RefreshCw } from "lucide-react";

const selectClass =
  "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors";

interface Counts {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);

    fetch(`/api/admin/opportunities?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        setItems(json.data ?? []);
        setCounts(json.counts ?? null);
      })
      .catch(() => {
        setItems([]);
        setCounts(null);
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
      } else {
        const rw = json.reliefweb;
        const dn = json.devnetjobs;
        const parts = [
          `ReliefWeb: ${rw.fetched} fetched${rw.error ? ` (${rw.error})` : ""}`,
          `DevNetJobs: ${dn.fetched} fetched${dn.error ? ` (${dn.error})` : ""}`,
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
        <button
          onClick={handleScanNow}
          disabled={scanning}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand hover:bg-brand-mid text-white text-sm font-medium transition-colors disabled:opacity-60 flex-shrink-0"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Scan now
        </button>
      </div>

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
            key: "category",
            header: "Category",
            render: (item: Opportunity) => (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-light text-brand uppercase">
                {item.category === "rfp" ? "RFP" : "Job"}
              </span>
            ),
          },
          {
            key: "location",
            header: "Location",
            render: (item: Opportunity) => item.location || "—",
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
        data={items}
        emptyMessage="No opportunities found yet. Run a scan or check back after the next daily scrape."
      />
    </div>
  );
}
