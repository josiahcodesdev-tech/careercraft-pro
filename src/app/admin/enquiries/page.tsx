"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type EnquiryEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Mail } from "lucide-react";

export default function EnquiriesPage() {
  const [items, setItems] = useState<EnquiryEvent[]>([]);

  useEffect(() => {
    setItems(getAnalytics().enquiries);
  }, []);

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <StatCard
          title="Total Enquiries"
          value={items.length}
          icon={Mail}
          gradient="bg-gradient-to-br from-[#0ea5e9] to-[#2563eb]"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "date",
            header: "Date",
            render: (item: EnquiryEvent) => (
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
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          {
            key: "service",
            header: "Service",
            render: (item: EnquiryEvent) => (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-light text-brand">
                {item.service || "—"}
              </span>
            ),
          },
          {
            key: "message",
            header: "Message",
            render: (item: EnquiryEvent) => (
              <span className="text-text-secondary truncate max-w-[200px] block">
                {item.message}
              </span>
            ),
          },
        ]}
        data={items}
        emptyMessage="No enquiries yet. Contact form submissions will appear here."
      />
    </div>
  );
}
