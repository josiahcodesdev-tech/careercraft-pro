"use client";

import { useEffect, useState } from "react";
import { type CvEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { FileText, Eye, X } from "lucide-react";

export default function CvWritingPage() {
  const [items, setItems] = useState<CvEvent[]>([]);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((json) => setItems(json.cvDownloads ?? []))
      .catch(() => setItems([]));
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
          {
            key: "actions",
            header: "Actions",
            render: (item: CvEvent) => {
              if (!item.id) return <span className="text-text-muted text-xs">—</span>;
              return (
                <button
                  onClick={() => {
                    fetch(`/api/admin/cv/${item.id}`)
                      .then((res) => res.json())
                      .then((json) => {
                        if (json.data) setViewing(json.data);
                        else alert("CV data not found.");
                      })
                      .catch(() => alert("Failed to load CV data."));
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
        emptyMessage="No CVs generated yet. Downloads from the CV Builder will appear here."
      />

      {/* CV Viewer Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewing(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[700px] max-h-[85vh] mx-4 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-heading text-lg font-extrabold tracking-tight">
                {(viewing.fullName as string) || "CV Preview"}
              </h2>
              <button onClick={() => setViewing(null)} className="text-text-muted hover:text-foreground text-xl px-2">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 text-sm">
                {viewing.tagline ? <p className="text-text-secondary italic">{viewing.tagline as string}</p> : null}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  {viewing.email ? <span>{viewing.email as string}</span> : null}
                  {viewing.phone ? <span>{viewing.phone as string}</span> : null}
                  {viewing.location ? <span>{viewing.location as string}</span> : null}
                </div>

                {viewing.summary ? (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-1">Summary</h3>
                    <p className="text-text-secondary">{viewing.summary as string}</p>
                  </div>
                ) : null}

                {Array.isArray(viewing.experience) && viewing.experience.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-2">Experience</h3>
                    {(viewing.experience as Array<Record<string, unknown>>).map((exp, i) => (
                      <div key={i} className="mb-3">
                        <div className="font-medium">{exp.role as string} {exp.company ? <span className="text-text-muted">— {exp.company as string}</span> : null}</div>
                        {Array.isArray(exp.bullets) && (
                          <ul className="list-disc pl-4 text-text-secondary text-xs mt-1 space-y-0.5">
                            {(exp.bullets as string[]).filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(viewing.education) && viewing.education.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-2">Education</h3>
                    {(viewing.education as Array<Record<string, unknown>>).map((edu, i) => (
                      <div key={i} className="mb-1">
                        <span className="font-medium">{edu.degree as string}{edu.field ? ` in ${edu.field as string}` : ""}</span>
                        {edu.institution ? <span className="text-text-muted"> — {edu.institution as string}</span> : null}
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(viewing.skillGroups) && viewing.skillGroups.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-2">Skills</h3>
                    {(viewing.skillGroups as Array<Record<string, unknown>>).filter((g) => g.category && g.skills).map((g, i) => (
                      <div key={i} className="mb-1">
                        <span className="font-medium">{g.category as string}: </span>
                        <span className="text-text-secondary">{g.skills as string}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-text-muted pt-2">Template: <span className="capitalize font-medium">{viewing.template as string}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
