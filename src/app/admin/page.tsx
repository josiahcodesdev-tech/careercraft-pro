"use client";

import { useEffect, useState, useMemo } from "react";
import { type Analytics } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { Mail, FileText, Users, Briefcase, Search } from "lucide-react";

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
    "CV Download": "bg-emerald-50 text-emerald-700",
    "Interview Prep": "bg-teal-50 text-teal-700",
    "Enquiry": "bg-sky-50 text-sky-700",
    "Proposal": "bg-amber-50 text-amber-700",
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
          gradient="bg-gradient-to-br from-[#0ea5e9] to-[#2563eb]"
          description={`${data.enquiries.filter((e) => isToday(e.date)).length} new today`}
        />
        <StatCard
          title="CV Writing"
          value={data.cvDownloads.length}
          icon={FileText}
          gradient="bg-gradient-to-br from-[#10b981] to-[#059669]"
          description="CVs generated"
        />
        <StatCard
          title="Interview Coaching"
          value={data.interviewPreps.length}
          icon={Users}
          gradient="bg-gradient-to-br from-[#14b8a6] to-[#0d9488]"
          description="Preps generated"
        />
        <StatCard
          title="Proposals"
          value={data.proposals.length}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-[#f59e0b] to-[#d97706]"
          description="Proposals tracked"
        />
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
