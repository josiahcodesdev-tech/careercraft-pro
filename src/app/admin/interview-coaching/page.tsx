"use client";

import { useEffect, useState } from "react";
import { type InterviewEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Users, Eye, User, FileText } from "lucide-react";

export default function InterviewCoachingPage() {
  const [items, setItems] = useState<InterviewEvent[]>([]);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((json) => setItems(json.interviewPreps ?? []))
      .catch(() => setItems([]));
  }, []);

  const dialogue = viewing?.dialogue as Array<{ section?: string; question: string; answer: string }> | undefined;

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
          {
            key: "actions",
            header: "Actions",
            render: (item: InterviewEvent) => {
              if (!item.id) return <span className="text-text-muted text-xs">—</span>;
              return (
                <button
                  onClick={() => {
                    fetch(`/api/admin/prep/${item.id}`)
                      .then((res) => res.json())
                      .then((json) => {
                        if (json.data) setViewing(json.data);
                        else alert("Interview prep data not found.");
                      })
                      .catch(() => alert("Failed to load interview prep data."));
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              );
            },
          },
        ]}
        data={items}
        emptyMessage="No interview preps generated yet. Activity from Interview Coaching will appear here."
      />

      {/* Interview Prep Viewer Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewing(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[750px] max-h-[85vh] mx-4 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Interview Prep — {(viewing.candidateName as string) || "Candidate"}
                </h2>
                <p className="text-xs text-text-muted">{(viewing.roleTitle as string) || ""}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-text-muted hover:text-foreground text-xl px-2">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {dialogue && dialogue.map((qa, i) => (
                <div key={i}>
                  {qa.section && (
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand border-b-2 border-brand pb-1 mb-3 mt-2">
                      {qa.section}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#EDF1F5] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-[#1B3A5C]" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-[#1B3A5C] mb-0.5">Interviewer</div>
                        <p className="text-sm">{qa.question}</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 pl-3">
                      <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-3 h-3 text-brand" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-brand mb-0.5">{viewing.candidateName as string}</div>
                        <p className="text-sm text-text-secondary">{qa.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!dialogue && (
                <p className="text-sm text-text-muted text-center py-8">Dialogue data not available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
