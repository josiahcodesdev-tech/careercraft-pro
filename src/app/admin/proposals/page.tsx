"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type ProposalEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Briefcase } from "lucide-react";

export default function ProposalsPage() {
  const [items, setItems] = useState<ProposalEvent[]>([]);

  useEffect(() => {
    setItems(getAnalytics().proposals);
  }, []);

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <StatCard
          title="Proposals Tracked"
          value={items.length}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-[#f59e0b] to-[#d97706]"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "date",
            header: "Date",
            render: (item: ProposalEvent) => (
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
          { key: "name", header: "Client / Project" },
        ]}
        data={items}
        emptyMessage="No proposals tracked yet. Proposal and grant activity will appear here as features are added."
      />
    </div>
  );
}
