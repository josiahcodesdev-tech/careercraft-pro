"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
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
}

// A textarea that, as the user pauses typing, fetches a short AI continuation
// (tailored to the pasted JD) and offers it inline — press Tab (or click) to
// append, Esc/typing to dismiss. Best-effort: failures are silent.
export function AssistedTextarea({ value, onChange, kind, jd, role, company, placeholder, className }: Props) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest value so a slow response for stale text is discarded.
  const latest = useRef(value);
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

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => {
          // Clear any stale suggestion the moment the user types.
          if (suggestion) setSuggestion("");
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {(loading || suggestion) && (
        <div className="mt-1.5 min-h-[26px]">
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
