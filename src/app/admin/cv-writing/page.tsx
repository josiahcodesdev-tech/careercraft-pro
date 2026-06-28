"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type CvEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { FileText } from "lucide-react";

export default function CvWritingPage() {
  const [items, setItems] = useState<CvEvent[]>([]);

  useEffect(() => {
    setItems(getAnalytics().cvDownloads);
  }, []);

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <StatCard
          title="Total CVs Generated"
          value={items.length}
          icon={FileText}
          gradient="bg-gradient-to-br from-[#10b981] to-[#059669]"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "date",
            header: "Date",
            render: (item: CvEvent) => (
              <span className="text-text-secondary whitespace-nowrap">
                {new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ),
          },
          { key: "name", header: "Candidate Name" },
          {
            key: "template",
            header: "Template",
            render: (item: CvEvent) => (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-light text-brand capitalize">
                {item.template}
              </span>
            ),
          },
        ]}
        data={items}
        emptyMessage="No CVs generated yet. Downloads from the CV Builder will appear here."
      />
    </div>
  );
}
