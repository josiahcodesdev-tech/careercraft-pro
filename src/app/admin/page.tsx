"use client";

import { useEffect, useState, useMemo } from "react";
import { type Analytics } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { WeeklyActivityChart, type DayBucket } from "@/components/admin/weekly-activity-chart";
import { RevenueShareChart, type RevenueSlice } from "@/components/admin/revenue-share-chart";
import { Mail, FileText, Users, Briefcase, Search } from "lucide-react";

// Fixed prices from the payment flow (PaymentModal `amount` props in
// cv-builder-form.tsx / interview-prep-form.tsx) — enquiries/proposals have
// no fixed price, so they're excluded from the revenue chart specifically.
const CV_PRICE = 40;
const INTERVIEW_PRICE = 100;

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface ActivityItem {
  type: string;
  name: string;
  detail: string;
  date: string;
}

const selectClass = "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors";

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateSort, setDateSort] = useState("newest");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((json) => setData(json as Analytics))
      .catch(() => setData({ cvDownloads: [], interviewPreps: [], enquiries: [], proposals: [] }));
  }, []);

  const weeklyDays: DayBucket[] = useMemo(() => {
    const days: DayBucket[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit" }),
        dateKey: localDateKey(d),
        values: [0, 0, 0, 0],
      });
    }
    if (!data) return days;

    const indexByKey = new Map(days.map((d, i) => [d.dateKey, i]));
    const bump = (dateStr: string, seriesIdx: number) => {
      const idx = indexByKey.get(localDateKey(new Date(dateStr)));
      if (idx !== undefined) days[idx].values[seriesIdx] += 1;
    };
    data.cvDownloads.forEach((e) => bump(e.date, 0));
    data.interviewPreps.forEach((e) => bump(e.date, 1));
    data.enquiries.forEach((e) => bump(e.date, 2));
    data.proposals.forEach((e) => bump(e.date, 3));
    return days;
  }, [data]);

  const revenueSlices: RevenueSlice[] = useMemo(() => {
    if (!data) return [];
    return [
      { key: "cv", label: "CV Writing", value: data.cvDownloads.length * CV_PRICE, color: "#008300" },
      { key: "interview", label: "Interview Coaching", value: data.interviewPreps.length * INTERVIEW_PRICE, color: "#2a78d6" },
    ].filter((s) => s.value > 0);
  }, [data]);

  const allItems: ActivityItem[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.cvDownloads.map((e) => ({ type: "CV Download", name: e.name, detail: e.template, date: e.date })),
      ...data.interviewPreps.map((e) => ({ type: "Interview Prep", name: e.name, detail: e.role, date: e.date })),
      ...data.enquiries.map((e) => ({ type: "Enquiry", name: e.name, detail: e.service, date: e.date })),
      ...data.proposals.map((e) => ({ type: "Proposal", name: e.name, detail: "", date: e.date })),
    ];
  }, [data]);

  const filtered = useMemo(() => {
    let result = allItems;
    if (typeFilter !== "all") result = result.filter((i) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      dateSort === "newest"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [allItems, typeFilter, search, dateSort]);

  if (!data) return null;

  const typeColors: Record<string, string> = {
    "CV Download": "bg-brand-light text-brand",
    "Interview Prep": "bg-brand-light text-brand-mid",
    "Enquiry": "bg-[#FBF3DC] text-[#8B6914]",
    "Proposal": "bg-[#FBF3DC] text-[#D4A017]",
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">Overview of all service activity</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Enquiries"
          value={data.enquiries.length}
          icon={Mail}
          gradient="bg-gradient-to-br from-[#D4A017] to-[#B8860B]"
          description={`${data.enquiries.filter((e) => isToday(e.date)).length} new today`}
        />
        <StatCard
          title="CV Writing"
          value={data.cvDownloads.length}
          icon={FileText}
          gradient="bg-gradient-to-br from-[#2E7D52] to-[#1A5C3A]"
          description="CVs generated"
        />
        <StatCard
          title="Interview Coaching"
          value={data.interviewPreps.length}
          icon={Users}
          gradient="bg-gradient-to-br from-[#1A5C3A] to-[#134A2E]"
          description="Preps generated"
        />
        <StatCard
          title="Proposals"
          value={data.proposals.length}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-[#134A2E] to-[#0B2F1D]"
          description="Proposals tracked"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <WeeklyActivityChart days={weeklyDays} />
        </div>
        <RevenueShareChart slices={revenueSlices} />
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs text-text-muted font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Name or detail..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setTypeFilter("all"); }}
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Type</label>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setSearch(""); }} className={selectClass}>
            <option value="all">All Types</option>
            <option value="CV Download">CV Download</option>
            <option value="Interview Prep">Interview Prep</option>
            <option value="Enquiry">Enquiry</option>
            <option value="Proposal">Proposal</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Date</label>
          <select value={dateSort} onChange={(e) => setDateSort(e.target.value)} className={selectClass}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted -mt-2">
        {filtered.length} {filtered.length === 1 ? "record" : "records"}
        {(search || typeFilter !== "all") && " matching filters"}
      </p>

      {/* Activity table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">No activity yet.</p>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item, i) => (
                <tr key={i} className="hover:bg-background/60 transition-colors">
                  <td className="px-5 py-3 text-text-secondary whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeColors[item.type] ?? "bg-brand-light text-brand"}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium">{item.name}</td>
                  <td className="px-5 py-3 text-text-secondary capitalize">{item.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
