"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type Analytics } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Mail, FileText, Users, Briefcase } from "lucide-react";

interface RecentItem {
  type: string;
  name: string;
  detail: string;
  date: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    setData(getAnalytics());
  }, []);

  if (!data) return null;

  const recent: RecentItem[] = [
    ...data.cvDownloads.map((e) => ({ type: "CV Download", name: e.name, detail: e.template, date: e.date })),
    ...data.interviewPreps.map((e) => ({ type: "Interview Prep", name: e.name, detail: e.role, date: e.date })),
    ...data.enquiries.map((e) => ({ type: "Enquiry", name: e.name, detail: e.service, date: e.date })),
    ...data.proposals.map((e) => ({ type: "Proposal", name: e.name, detail: "", date: e.date })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-secondary">
          Overview of all service activity
        </p>
      </div>

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

      {/* Recent activity */}
      <div>
        <h2 className="font-heading text-lg font-extrabold tracking-tight mb-4">
          Recent Activity
        </h2>
        <DataTable
          columns={[
            {
              key: "date",
              header: "Date",
              render: (item: RecentItem) => (
                <span className="text-text-secondary whitespace-nowrap">
                  {new Date(item.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (item: RecentItem) => (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-light text-brand">
                  {item.type}
                </span>
              ),
            },
            { key: "name", header: "Name" },
            { key: "detail", header: "Detail" },
          ]}
          data={recent}
          emptyMessage="No activity yet. Use the public site to generate data."
        />
      </div>
    </div>
  );
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
