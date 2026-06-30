"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, FileText, Loader2, CheckCircle, X, Sparkles, ArrowRight } from "lucide-react";

const CV_TRANSFORM_KEY = "careercraft_cv_transform";

const scanSteps = [
  "Scanning document...",
  "Extracting text content...",
  "Analysing CV structure with AI...",
  "Parsing experience & education...",
  "Formatting for ATS compliance...",
];

interface ParsedCv {
  fullName: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  experience: { company: string; role: string; startDate: string; endDate: string; current: boolean; bullets: string[] }[];
  education: { institution: string; degree: string; field: string; startDate: string; endDate: string }[];
  skillGroups: { category: string; skills: string }[];
}

interface FileItem {
  id: string;
  name: string;
  status: "pending" | "scanning" | "done" | "error";
  scanStep: number;
  parsed: ParsedCv | null;
  error: string;
}

async function processFile(f: File): Promise<ParsedCv> {
  let text: string;
  if (f.name.toLowerCase().endsWith(".pdf")) {
    text = await extractTextFromPdf(f);
  } else {
    text = await f.text();
  }
  if (!text || text.trim().length < 20) throw new Error("Could not extract readable text.");

  const res = await fetch("/api/cv-transform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const json = await res.json() as { error?: string };
    throw new Error(json.error ?? "AI parsing failed.");
  }
  const json = await res.json() as { result?: ParsedCv };
  if (!json.result) throw new Error("AI returned no data.");
  return json.result;
}

export default function AdminCvTransformPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const updateItem = useCallback((id: string, patch: Partial<FileItem>) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
  }, []);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const newItems: FileItem[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      status: "pending",
      scanStep: 0,
      parsed: null,
      error: "",
    }));
    setItems((prev) => [...prev, ...newItems]);
    setProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const item = newItems[i];
      updateItem(item.id, { status: "scanning", scanStep: 0 });

      for (let s = 0; s < scanSteps.length - 1; s++) {
        await new Promise((r) => setTimeout(r, 600));
        updateItem(item.id, { scanStep: s + 1 });
      }

      try {
        const parsed = await processFile(files[i]);
        updateItem(item.id, { status: "done", parsed, scanStep: scanSteps.length - 1 });
      } catch (err) {
        updateItem(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Failed to process.",
        });
      }
    }
    setProcessing(false);
  }, [updateItem]);

  const handleLoad = (parsed: ParsedCv) => {
    localStorage.setItem(CV_TRANSFORM_KEY, JSON.stringify(parsed));
    router.push("/cv-builder?transform=1");
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl font-extrabold tracking-tight mb-1">Batch CV Transform</h2>
        <p className="text-sm text-text-secondary">
          Upload multiple client CVs at once. AI scans each one and formats it to ATS standard.
          Click <strong>Load in Builder</strong> on any CV to open it for editing and download.
        </p>
      </div>

      {/* Upload area */}
      <label className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-border rounded-2xl bg-card cursor-pointer hover:border-brand/40 hover:bg-brand-light/20 transition-all">
        <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center">
          <Upload className="w-6 h-6 text-brand" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold mb-1">
            {processing ? "Processing — drop more files to queue..." : "Upload Client CVs"}
          </p>
          <p className="text-xs text-text-muted">Select one or multiple PDFs, DOC, DOCX, or TXT files</p>
        </div>
        <input type="file" accept=".pdf,.doc,.docx,.txt" multiple onChange={handleUpload} className="hidden" />
      </label>

      {/* Summary bar */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-secondary">
            {doneCount} of {items.length} processed
          </span>
          {!processing && (
            <button onClick={() => setItems([])} className="text-xs text-text-muted hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* File cards */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.status === "done" ? "bg-green-100" :
                item.status === "error" ? "bg-red-100" : "bg-brand-light"
              }`}>
                {item.status === "scanning" ? <Loader2 className="w-4 h-4 text-brand animate-spin" />
                : item.status === "done" ? <CheckCircle className="w-4 h-4 text-green-600" />
                : item.status === "error" ? <X className="w-4 h-4 text-red-500" />
                : <FileText className="w-4 h-4 text-brand" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className={`text-xs ${
                  item.status === "done" ? "text-green-600" :
                  item.status === "error" ? "text-red-500" :
                  item.status === "scanning" ? "text-brand" : "text-text-muted"
                }`}>
                  {item.status === "pending" ? "Waiting in queue..." :
                   item.status === "scanning" ? scanSteps[item.scanStep] :
                   item.status === "done" ? `✓ ${item.parsed?.fullName || "Processed"}` :
                   item.error}
                </p>
              </div>
              {(item.status === "done" || item.status === "error") && (
                <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-red-500 transition-colors p-1 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {item.status === "scanning" && (
              <div className="px-4 pb-4 space-y-1.5">
                {scanSteps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i < item.scanStep ? (
                      <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      </div>
                    ) : i === item.scanStep ? (
                      <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                    )}
                    <span className={`text-xs ${i <= item.scanStep ? "text-foreground font-medium" : "text-text-muted"}`}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {item.status === "done" && item.parsed && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-text-muted mb-0.5">Name</p>
                    <p className="font-semibold truncate">{item.parsed.fullName || "—"}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-text-muted mb-0.5">Roles</p>
                    <p className="font-semibold">{item.parsed.experience.length}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-text-muted mb-0.5">Education</p>
                    <p className="font-semibold">{item.parsed.education.length}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-text-muted mb-0.5">Skills</p>
                    <p className="font-semibold">{item.parsed.skillGroups.length}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleLoad(item.parsed!)}
                  className={cn(buttonVariants(), "bg-brand hover:bg-brand-mid text-white w-full gap-2 h-9 text-sm")}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Load in CV Builder <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
