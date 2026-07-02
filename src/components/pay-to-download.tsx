"use client";

import { useRef, useState } from "react";
import { CheckCircle, Download, X } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+254", flag: "🇰🇪" }, { code: "+256", flag: "🇺🇬" },
  { code: "+255", flag: "🇹🇿" }, { code: "+251", flag: "🇪🇹" },
  { code: "+250", flag: "🇷🇼" }, { code: "+1",   flag: "🇺🇸" },
  { code: "+44",  flag: "🇬🇧" }, { code: "+27",  flag: "🇿🇦" },
];

interface Props {
  price: number;
  tier: string;
  label?: string;
  className?: string;
  onSuccess: () => void;
}

export function PayToDownload({ price, tier, label = "Download PDF", className, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("+254");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [state, setState] = useState<"idle" | "waiting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function close() {
    clearInterval(pollRef.current!);
    clearTimeout(timeoutRef.current!);
    setOpen(false);
    setState("idle");
    setError(null);
    setPaying(false);
  }

  async function pay() {
    if (!phone.trim()) return;
    setPaying(true);
    setError(null);
    try {
      const fullPhone = `${countryCode}${phone.replace(/^0/, "")}`;
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, amount: price, tier }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d?.error ?? "Payment failed. Please try again.");
        setState("error");
        return;
      }
      setState("waiting");
      poll(d.ref);
    } catch {
      setError("Network error. Check your connection.");
      setState("error");
    } finally {
      setPaying(false);
    }
  }

  function poll(ref: string) {
    let alive = true;

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/payments/status?ref=${ref}`);
      if (!res.ok || !alive) return;
      const d = await res.json();
      if (d.status === "success") {
        clearInterval(pollRef.current!);
        clearTimeout(timeoutRef.current!);
        if (alive) {
          setState("success");
          setTimeout(() => { close(); onSuccess(); }, 1200);
        }
      } else if (d.status === "failed") {
        clearInterval(pollRef.current!);
        clearTimeout(timeoutRef.current!);
        if (alive) {
          setState("error");
          setError("Payment declined. Please try again.");
        }
      }
    }, 3000);

    timeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current!);
      if (alive) {
        setState("error");
        setError("Timed out. Check your M-Pesa and try again.");
      }
    }, 120_000);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        <Download className="w-4 h-4" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-heading text-[17px] font-extrabold tracking-tight">
                Pay to Download
              </h2>
              <button onClick={close} className="text-text-muted hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {state === "success" ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                  <p className="font-semibold text-sm">Payment confirmed — starting download…</p>
                </div>
              ) : state === "waiting" ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                  <p className="text-sm text-text-secondary">Check your phone for the M-Pesa prompt…</p>
                  <p className="text-xs text-text-muted">This may take up to a minute.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-brand-light border border-brand/20 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Download fee</span>
                    <span className="text-lg font-black">KES {price.toLocaleString()}</span>
                  </div>

                  {state === "error" && (
                    <p className="text-xs text-red-500 font-medium">{error}</p>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                      M-Pesa number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="h-10 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand w-[90px] flex-shrink-0"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        placeholder="712 345 678"
                        value={phone}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^\d\s]/g, "");
                          if (v.startsWith("0")) v = v.slice(1);
                          setPhone(v);
                        }}
                        className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  </div>

                  <button
                    disabled={paying || !phone.trim()}
                    onClick={pay}
                    className="h-10 w-full rounded-lg bg-brand hover:bg-brand-mid text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paying ? "Sending prompt…" : `Pay KES ${price.toLocaleString()} via M-Pesa`}
                  </button>

                  <p className="text-[11px] text-text-muted text-center leading-relaxed">
                    Processed securely by <span className="font-medium">PayHero</span>. Your M-Pesa details are not stored by MyCareerCraft.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
