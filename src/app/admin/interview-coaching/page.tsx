"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type InterviewEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Users } from "lucide-react";

export default function InterviewCoachingPage() {
  const [items, setItems] = useState<InterviewEvent[]>([]);

  useEffect(() => {
    setItems(getAnalytics().interviewPreps);
  }, []);

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <StatCard
          title="Interview Preps Generated"
          value={items.length}
          icon={Users}
          gradient="bg-gradient-to-br from-[#14b8a6] to-[#0d9488]"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "date",
            header: "Date",
            render: (item: InterviewEvent) => (
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
          { key: "role", header: "Role / Job Title" },
        ]}
        data={items}
        emptyMessage="No interview preps generated yet. Activity from Interview Coaching will appear here."
      />
    </div>
  );
}
