"use client";

import { useEffect, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link2, List, Loader2, Sparkles, Underline } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (value: string) => void;
  kind: "summary" | "bullet";
  jd?: string;
  role?: string;
  company?: string;
  placeholder?: string;
  className?: string;
  editor?: boolean;
}

// A textarea that, as the user pauses typing, fetches a short AI continuation
// (tailored to the pasted JD) and offers it inline — press Tab (or click) to
// append, Esc/typing to dismiss. Best-effort: failures are silent.
export function AssistedTextarea({ value, onChange, kind, jd, role, company, placeholder, className, editor = false }: Props) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest value so a slow response for stale text is discarded.
  const latest = useRef(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textStyle, setTextStyle] = useState({ bold: false, italic: false, underline: false, align: "left" });
  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 12) return;

    timer.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/cv-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value, kind, jd, role, company }),
        });
        const json = (await res.json()) as { suggestion?: string };
        if (res.ok && json.suggestion && latest.current === value) {
          setSuggestion(json.suggestion);
        }
      } catch {
        /* silent — inline assist is best-effort */
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, kind, jd, role, company]);

  function accept() {
    if (!suggestion) return;
    const needsSpace =
      value.length > 0 && !/\s$/.test(value) && !/^\s/.test(suggestion) && !/^[.,;:!?]/.test(suggestion);
    onChange(value + (needsSpace ? " " : "") + suggestion.replace(/^\s+/, ""));
    setSuggestion("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!suggestion) return;
    if (e.key === "Tab") {
      e.preventDefault();
      accept();
    } else if (e.key === "Escape") {
      setSuggestion("");
    }
  }

  function toggleList() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || value;
    const listed = selected.split("\n").map((line) => line.startsWith("• ") ? line.slice(2) : `• ${line}`).join("\n");
    onChange(value.slice(0, start) + listed + value.slice(end));
    requestAnimationFrame(() => textarea.focus());
  }

  const toolbarButton = "flex h-8 w-8 items-center justify-center rounded-md text-[#25183f] transition-colors hover:bg-white disabled:opacity-40";

  return (
    <div className={editor ? "overflow-hidden rounded-xl border border-border bg-[#f3f3f6]" : ""}>
      {editor && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-[#f7f7f9] px-3 py-2">
          <button type="button" aria-label="Bold" aria-pressed={textStyle.bold} onClick={() => setTextStyle((s) => ({ ...s, bold: !s.bold }))} className={`${toolbarButton} ${textStyle.bold ? "bg-brand text-white hover:bg-brand" : ""}`}><Bold className="h-4 w-4" /></button>
          <button type="button" aria-label="Italic" aria-pressed={textStyle.italic} onClick={() => setTextStyle((s) => ({ ...s, italic: !s.italic }))} className={`${toolbarButton} ${textStyle.italic ? "bg-brand text-white hover:bg-brand" : ""}`}><Italic className="h-4 w-4" /></button>
          <button type="button" aria-label="Underline" aria-pressed={textStyle.underline} onClick={() => setTextStyle((s) => ({ ...s, underline: !s.underline }))} className={`${toolbarButton} ${textStyle.underline ? "bg-brand text-white hover:bg-brand" : ""}`}><Underline className="h-4 w-4" /></button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button type="button" aria-label="Toggle bullet list" onClick={toggleList} className={toolbarButton}><List className="h-4 w-4" /></button>
          <button type="button" aria-label="Insert link" title="Paste a link directly into the text" onClick={() => textareaRef.current?.focus()} className={toolbarButton}><Link2 className="h-4 w-4" /></button>
          <span className="mx-1 h-5 w-px bg-border" />
          {(["left", "center", "right"] as const).map((align) => {
            const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
            return <button key={align} type="button" aria-label={`Align ${align}`} aria-pressed={textStyle.align === align} onClick={() => setTextStyle((s) => ({ ...s, align }))} className={`${toolbarButton} ${textStyle.align === align ? "bg-brand text-white hover:bg-brand" : ""}`}><Icon className="h-4 w-4" /></button>;
          })}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          // Clear any stale suggestion the moment the user types.
          if (suggestion) setSuggestion("");
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className ?? ""} ${editor ? "rounded-none border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0" : ""} ${textStyle.bold ? "font-bold" : ""} ${textStyle.italic ? "italic" : ""} ${textStyle.underline ? "underline" : ""}`}
        style={editor ? { textAlign: textStyle.align as "left" | "center" | "right" } : undefined}
      />
      {(loading || suggestion) && (
        <div className={editor ? "border-t border-border bg-white px-3 py-2 min-h-[40px]" : "mt-1.5 min-h-[26px]"}>
          {suggestion ? (
            <button
              type="button"
              onClick={accept}
              title="Press Tab to add"
              className="group inline-flex items-start gap-1.5 text-left rounded-lg border border-brand/30 bg-brand-light/60 px-2.5 py-1.5 hover:bg-brand/10 transition-colors max-w-full"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
              <span className="text-xs text-text-secondary">…{suggestion.trim()}</span>
              <kbd className="ml-1 flex-shrink-0 rounded border border-border bg-background px-1.5 text-[10px] font-semibold text-text-muted">
                Tab
              </kbd>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" /> Suggesting…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
