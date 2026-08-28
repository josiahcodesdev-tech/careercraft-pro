"use client";

import { useState } from "react";
import { Sparkles, Loader2, Upload, X, Check, FileText } from "lucide-react";
import { ocrJdImage, imageFromPaste } from "@/lib/jd-image";
import { readDocumentText } from "@/lib/doc-text";

export interface JdDraft {
  role: string;
  summary: string;
  skills: string[];
}

const CV_EXTENSIONS = ["pdf", "doc", "docx", "txt"];

// A compact panel for the CV Builder: paste/upload a job-description (text or a
// screenshot) and, optionally, upload the CV to be tailored. With a CV attached
// the whole document is rewritten against the JD and loaded into the builder;
// without one we only pre-fill a tailored draft (headline, summary, key skills)
// that the user then completes with their real experience.
export function JdTailor({
  onApply,
  onImport,
  onOpenChange,
  floating = false,
}: {
  onApply: (draft: JdDraft, jd: string) => void;
  onImport?: (parsed: Record<string, unknown>, jd: string) => void;
  onOpenChange?: (open: boolean) => void;
  floating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [ocr, setOcr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<"" | "draft" | "cv">("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [reading, setReading] = useState(false);

  function toggle(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  async function handleJdFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    try {
      setOcr(true);
      if (f.type.startsWith("image/")) {
        setJd(await ocrJdImage(f));
      } else {
        setJd((await readDocumentText(f)).slice(0, 5000));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the file.");
    } finally {
      setOcr(false);
    }
    e.target.value = "";
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const img = imageFromPaste(e);
    if (!img) return; // no image → allow normal text paste
    e.preventDefault();
    setError("");
    try {
      setOcr(true);
      setJd(await ocrJdImage(img));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read the pasted image.");
    } finally {
      setOcr(false);
    }
  }

  // Read the CV as soon as it is picked so the tailor click only waits on the
  // AI call — and so an unreadable file is reported now, not after the wait.
  async function handleCvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const extension = f.name.toLowerCase().split(".").pop();
    if (!extension || !CV_EXTENSIONS.includes(extension)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    setError("");
    setCvFile(f);
    setCvText("");
    setReading(true);
    try {
      setCvText(await readDocumentText(f));
    } catch (err) {
      setCvFile(null);
      setError(err instanceof Error ? err.message : "Could not read this file.");
    } finally {
      setReading(false);
    }
  }

  function clearCv() {
    setCvFile(null);
    setCvText("");
  }

  // With a CV attached we rewrite the real document against the JD; otherwise
  // we only draft a headline/summary/skills starting point.
  async function tailorUploadedCv() {
    if (!cvFile || !onImport) return;
    const text = cvText || (await readDocumentText(cvFile));
    if (!text || text.trim().length < 20) {
      throw new Error(
        cvFile.name.toLowerCase().endsWith(".pdf")
          ? "This PDF is image-based and cannot be scanned. Please upload a Word or text version instead."
          : "Could not extract readable text from this file."
      );
    }
    const res = await fetch("/api/cv-transform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, jobDescription: jd }),
    });
    const json = (await res.json()) as { result?: Record<string, unknown>; error?: string };
    if (!res.ok || !json.result) throw new Error(json.error ?? "Could not tailor this CV.");
    onImport(json.result, jd);
    setApplied("cv");
  }

  async function tailorDraftOnly() {
    const res = await fetch("/api/jd-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: jd }),
    });
    const json = (await res.json()) as { draft?: JdDraft; error?: string };
    if (!res.ok || !json.draft) throw new Error(json.error ?? "Could not process the job description.");
    onApply(json.draft, jd);
    setApplied("draft");
  }

  async function apply() {
    if (!jd.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (cvFile && onImport) {
        await tailorUploadedCv();
      } else {
        await tailorDraftOnly();
      }
      toggle(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => toggle(true)}
        className={floating
          ? "group inline-flex w-full items-center gap-3 rounded-2xl border border-brand/15 bg-white px-4 py-4 text-left shadow-[0_10px_28px_rgba(20,64,47,0.10)] transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_14px_34px_rgba(20,64,47,0.16)]"
          : "w-full inline-flex items-center gap-2.5 rounded-xl border border-brand/20 bg-brand-light px-4 py-3 text-left transition-colors hover:border-brand/50 hover:bg-brand/10"}
      >
        <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-brand leading-tight">Tailor CV for a job description</span>
          <span className="block text-xs text-text-muted leading-tight mt-0.5">
            {applied === "cv"
              ? "CV tailored to the job — review it below"
              : applied === "draft"
                ? "Draft tailored — edit below, or tailor to another job"
                : "Paste the job post and upload your CV"}
          </span>
        </span>
        {applied && <Check className="w-4 h-4 text-brand" />}
      </button>
    );
  }

  return (
    <div className={`rounded-xl border border-brand/30 bg-brand-light/50 p-4 ${floating ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-brand">Tailor this CV to a job</p>
        <button type="button" onClick={() => toggle(false)} className="text-text-muted hover:text-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Job description */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
        Job description <span className="text-red-500">*</span>
      </p>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        onPaste={handlePaste}
        placeholder="Paste the job description — or paste/upload a screenshot of it…"
        rows={5}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors resize-none"
      />
      <label className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-brand cursor-pointer hover:underline">
        {ocr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {ocr ? "Reading job post…" : "upload screenshot / file"}
        <input type="file" accept=".txt,.pdf,.docx,image/*" onChange={handleJdFile} className="hidden" />
      </label>

      {/* CV to tailor */}
      {onImport && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Your current CV <span className="font-normal normal-case tracking-normal">(optional)</span>
          </p>
          {cvFile ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                {reading ? <Loader2 className="w-4 h-4 text-brand animate-spin" /> : <FileText className="w-4 h-4 text-brand" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cvFile.name}</p>
                <p className="text-xs text-text-muted">{reading ? "Reading document…" : "Will be rewritten to match this job"}</p>
              </div>
              <button type="button" onClick={clearCv} className="text-text-muted hover:text-red-500 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand/35 bg-background px-3 py-3 transition-colors hover:border-brand/60 hover:bg-brand/5">
              <span className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-brand" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium leading-tight">Upload the CV to tailor</span>
                <span className="block text-xs text-text-muted leading-tight mt-0.5">PDF, Word (.docx) or TXT</span>
              </span>
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleCvFile} className="hidden" />
            </label>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={apply}
          disabled={!jd.trim() || busy || ocr || reading}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand hover:bg-brand-mid text-white text-sm font-medium transition-colors disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy ? "Tailoring…" : "Tailor my CV"}
        </button>
      </div>
      <p className="text-[11px] text-text-muted mt-2 leading-snug">
        {cvFile
          ? "Your CV is rewritten around this job and loaded into the builder — we work from what is in your document, we don't invent experience."
          : "Fills in a target headline, summary and key skills. Add your real experience below — we don't invent it."}
      </p>
    </div>
  );
}
