"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type CvEvent } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, Eye, Download, Loader2, Plus } from "lucide-react";
import {
  type CvData,
  type Template,
  ClassicPreview,
  ModernPreview,
  ExecutivePreview,
  MinimalPreview,
  BoldPreview,
  ProfessionalPreview,
  CreativePreview,
  CorporatePreview,
  FlorencePreview,
} from "@/components/cv-builder-form";

const PREVIEW_BY_TEMPLATE: Record<Template, React.ComponentType<{ data: CvData }>> = {
  classic: ClassicPreview,
  modern: ModernPreview,
  executive: ExecutivePreview,
  minimal: MinimalPreview,
  bold: BoldPreview,
  professional: ProfessionalPreview,
  creative: CreativePreview,
  corporate: CorporatePreview,
  florence: FlorencePreview,
};

type StoredCv = CvData & { template: Template };

export default function CvWritingPage() {
  const [items, setItems] = useState<CvEvent[]>([]);
  const [viewing, setViewing] = useState<StoredCv | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pdfTarget, setPdfTarget] = useState<{ cv: StoredCv; fileName: string } | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((json) => setItems(json.cvDownloads ?? []))
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

  async function fetchCv(id: string): Promise<StoredCv> {
    const res = await fetch(`/api/admin/cv/${id}`);
    const json = await res.json();
    if (!json.data) throw new Error("CV data not found.");
    return json.data as StoredCv;
  }

  async function handleView(id: string) {
    try {
      setViewing(await fetchCv(id));
    } catch {
      alert("Failed to load CV data.");
    }
  }

  async function handleDownloadPdf(id: string, name: string) {
    setBusyId(id);
    try {
      const cv = await fetchCv(id);
      setPdfTarget({ cv, fileName: `${(name || "Candidate").replace(/\s+/g, "_")}_CV` });
    } catch {
      alert("Failed to download CV.");
      setBusyId(null);
    }
  }

  async function handleDownloadWord(id: string) {
    setBusyId(id);
    try {
      const cv = await fetchCv(id);
      const { downloadCvDocx } = await import("@/lib/cv-docx-export");
      await downloadCvDocx(cv);
    } catch {
      alert("Failed to download CV.");
    }
    setBusyId(null);
  }

  const PdfPreviewComponent = pdfTarget ? PREVIEW_BY_TEMPLATE[pdfTarget.cv.template] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-xs flex-1">
          <StatCard
            title="Total CVs Generated"
            value={items.length}
            icon={FileText}
            gradient="bg-gradient-to-br from-[#2E7D52] to-[#1A5C3A]"
          />
        </div>
        <Link
          href="/admin/cv-writing/new"
          className={cn(buttonVariants(), "bg-brand hover:bg-brand-mid text-white gap-2 flex-shrink-0")}
        >
          <Plus className="w-4 h-4" /> Create New
        </Link>
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
                  <button
                    onClick={() => handleDownloadWord(item.id!)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline disabled:opacity-40"
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Word
                  </button>
                </div>
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
                {viewing.fullName || "CV Preview"}
              </h2>
              <button onClick={() => setViewing(null)} className="text-text-muted hover:text-foreground text-xl px-2">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 text-sm">
                {viewing.tagline ? <p className="text-text-secondary italic">{viewing.tagline}</p> : null}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  {viewing.email ? <span>{viewing.email}</span> : null}
                  {viewing.phone ? <span>{viewing.phone}</span> : null}
                  {viewing.location ? <span>{viewing.location}</span> : null}
                </div>

                {viewing.summary ? (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-1">Summary</h3>
                    <p className="text-text-secondary">{viewing.summary}</p>
                  </div>
                ) : null}

                {viewing.experience.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-2">Experience</h3>
                    {viewing.experience.map((exp, i) => (
                      <div key={i} className="mb-3">
                        <div className="font-medium">{exp.role} {exp.company ? <span className="text-text-muted">— {exp.company}</span> : null}</div>
                        {exp.bullets.length > 0 && (
                          <ul className="list-disc pl-4 text-text-secondary text-xs mt-1 space-y-0.5">
                            {exp.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {viewing.education.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-2">Education</h3>
                    {viewing.education.map((edu, i) => (
                      <div key={i} className="mb-1">
                        <span className="font-medium">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
                        {edu.institution ? <span className="text-text-muted"> — {edu.institution}</span> : null}
                      </div>
                    ))}
                  </div>
                )}

                {viewing.skillGroups.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-2">Skills</h3>
                    {viewing.skillGroups.filter((g) => g.category && g.skills).map((g, i) => (
                      <div key={i} className="mb-1">
                        <span className="font-medium">{g.category}: </span>
                        <span className="text-text-secondary">{g.skills}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(viewing.projects ?? []).filter((p) => p.name).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-brand mb-2">Projects</h3>
                    {(viewing.projects ?? []).filter((p) => p.name).map((proj, i) => (
                      <div key={i} className="mb-3">
                        <div className="font-medium">
                          {proj.name}
                          {proj.link ? <span className="text-text-muted"> — {proj.link}</span> : null}
                        </div>
                        {proj.technologies ? (
                          <div className="text-xs text-text-muted italic">{proj.technologies}</div>
                        ) : null}
                        {proj.bullets.filter(Boolean).length > 0 && (
                          <ul className="list-disc pl-4 text-text-secondary text-xs mt-1 space-y-0.5">
                            {proj.bullets.filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-text-muted pt-2">Template: <span className="capitalize font-medium">{viewing.template}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen render target used to generate the PDF for redownload */}
      {pdfTarget && PdfPreviewComponent && (
        <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
          <div
            ref={pdfRef}
            className="bg-white rounded-lg shadow-md mx-auto overflow-hidden"
            style={{ maxWidth: 680, minHeight: 900 }}
          >
            <PdfPreviewComponent data={pdfTarget.cv} />
          </div>
        </div>
      )}
    </div>
  );
}
