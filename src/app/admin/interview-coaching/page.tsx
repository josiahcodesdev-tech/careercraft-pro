"use client";

import { useEffect, useRef, useState } from "react";
import { type InterviewEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { Users, Eye, User, FileText, Download, Loader2 } from "lucide-react";
import { InterviewDialogueContent, type QA } from "@/components/interview-prep-form";

interface StoredPrep {
  candidateName: string;
  roleTitle: string;
  dialogue: QA[];
}

export default function InterviewCoachingPage() {
  const [items, setItems] = useState<InterviewEvent[]>([]);
  const [viewing, setViewing] = useState<StoredPrep | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pdfTarget, setPdfTarget] = useState<{ prep: StoredPrep; fileName: string } | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((json) => setItems(json.interviewPreps ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!pdfTarget) return;
    let cancelled = false;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled || !pdfRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = ((await import("html2pdf.js")) as any).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: `${pdfTarget.fileName}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 3, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(pdfRef.current)
        .save();
      if (!cancelled) {
        setPdfTarget(null);
        setBusyId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfTarget]);

  async function fetchPrep(id: string): Promise<StoredPrep> {
    const res = await fetch(`/api/admin/prep/${id}`);
    const json = await res.json();
    if (!json.data) throw new Error("Interview prep data not found.");
    return json.data as StoredPrep;
  }

  async function handleView(id: string) {
    try {
      setViewing(await fetchPrep(id));
    } catch {
      alert("Failed to load interview prep data.");
    }
  }

  async function handleDownloadPdf(id: string, name: string) {
    setBusyId(id);
    try {
      const prep = await fetchPrep(id);
      setPdfTarget({ prep, fileName: `Interview_Prep_${(name || "Candidate").replace(/\s+/g, "_")}` });
    } catch {
      alert("Failed to download interview prep.");
      setBusyId(null);
    }
  }

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
              const isBusy = busyId === item.id;
              return (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleView(item.id!)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(item.id!, item.name)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline disabled:opacity-40"
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                  </button>
                </div>
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
                  Interview Prep — {viewing.candidateName || "Candidate"}
                </h2>
                <p className="text-xs text-text-muted">{viewing.roleTitle || ""}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-text-muted hover:text-foreground text-xl px-2">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {viewing.dialogue.map((qa, i) => (
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
                        <div className="text-[10px] font-bold uppercase text-brand mb-0.5">{viewing.candidateName}</div>
                        <p className="text-sm text-text-secondary">{qa.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Off-screen render target used to generate the PDF for redownload */}
      {pdfTarget && (
        <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
          <div
            ref={pdfRef}
            className="bg-white rounded-lg shadow-md mx-auto p-10 sm:p-12"
            style={{
              fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
              maxWidth: 700,
              minHeight: 900,
            }}
          >
            <InterviewDialogueContent
              candidateName={pdfTarget.prep.candidateName}
              roleTitle={pdfTarget.prep.roleTitle}
              dialogue={pdfTarget.prep.dialogue}
              paid
            />
          </div>
        </div>
      )}
    </div>
  );
}
