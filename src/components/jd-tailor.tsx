"use client";

import { useState } from "react";
import { Sparkles, Loader2, Upload, X, Check } from "lucide-react";
import { ocrJdImage, imageFromPaste } from "@/lib/jd-image";

export interface JdDraft {
  role: string;
  summary: string;
  skills: string[];
}

// A compact panel for the CV Builder: paste/upload a job-description (text or a
// screenshot) and pre-fill a tailored draft (headline, summary, key skills)
// that the user then completes with their real experience.
export function JdTailor({ onApply }: { onApply: (draft: JdDraft, jd: string) => void }) {
  const [open, setOpen] = useState(false);
  const [jd, setJd] = useState("");
  const [ocr, setOcr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    try {
      if (f.type.startsWith("image/")) {
        setOcr(true);
        setJd(await ocrJdImage(f));
      } else {
        setJd((await f.text()).slice(0, 5000));
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

  async function apply() {
    if (!jd.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/jd-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });
      const json = (await res.json()) as { draft?: JdDraft; error?: string };
      if (!res.ok || !json.draft) throw new Error(json.error ?? "Could not process the job description.");
      onApply(json.draft, jd);
      setApplied(true);
      setOpen(false);
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
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center gap-2.5 rounded-xl border border-brand/20 bg-brand-light px-4 py-3 text-left transition-colors hover:border-brand/50 hover:bg-brand/10"
      >
        <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-brand leading-tight">Tailor this CV to a job</span>
          <span className="block text-xs text-text-muted leading-tight mt-0.5">
            {applied ? "Draft tailored — edit below, or tailor to another job" : "Paste or upload a job post (text or screenshot)"}
          </span>
        </span>
        {applied && <Check className="w-4 h-4 text-brand" />}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-light/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-brand">Tailor this CV to a job</p>
        <button type="button" onClick={() => setOpen(false)} className="text-text-muted hover:text-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        onPaste={handlePaste}
        placeholder="Paste the job description — or paste/upload a screenshot of it…"
        rows={5}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors resize-none"
      />
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      <div className="flex items-center gap-3 mt-2.5">
        <button
          type="button"
          onClick={apply}
          disabled={!jd.trim() || busy || ocr}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand hover:bg-brand-mid text-white text-sm font-medium transition-colors disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Tailor my CV
        </button>
        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-brand cursor-pointer hover:underline">
          {ocr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {ocr ? "Reading image…" : "upload screenshot / file"}
          <input type="file" accept=".txt,image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      <p className="text-[11px] text-text-muted mt-2 leading-snug">
        Fills in a target headline, summary and key skills. Add your real experience below — we don&apos;t invent it.
      </p>
    </div>
  );
}
