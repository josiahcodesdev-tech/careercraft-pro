"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Receipt,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface PaymentModalProps {
  service: string;
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

type Stage = "idle" | "pushing" | "polling" | "success" | "failed";

function genRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MCC${ts}${rnd}`;
}

function formatTime(d: Date) {
  return d.toLocaleString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Status checks now hit our own DB first (populated by PayHero's webhook)
// before falling back to PayHero's API, so a tighter interval no longer
// means hammering an external service on every tick.
const POLL_INTERVAL_MS = 1200;
const MAX_POLLS = 100; // 100 × 1.2 s = 2 min

export function PaymentModal({ service, amount, onSuccess, onClose }: PaymentModalProps) {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [pollRef, setPollRef] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [lastRawStatus, setLastRawStatus] = useState<string>("");
  const paidAt = useRef(new Date());

  const handlePay = useCallback(async () => {
    const raw = phone.trim();
    if (!raw) { setError("Enter your M-Pesa phone number."); return; }

    setError("");
    setLastRawStatus("");
    setStage("pushing");
    const reference = genRef();
    setExternalRef(reference);

    try {
      const res = await fetch("/api/payhero/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: raw, amount, reference }),
      });
      const data = await res.json() as { error?: string; checkoutRequestId?: string };

      if (!res.ok) {
        setStage("failed");
        setError(data.error || "Could not send payment request. Please check your number.");
        return;
      }

      // Poll using our own external_reference — PayHero's transaction-status
      // endpoint looks transactions up by that (confirmed against the
      // PayHero dashboard's "External Ref." column), not by the raw
      // Safaricom-style checkoutRequestId, which it returns NOT_FOUND for.
      setPollRef(reference);
      setPollCount(0);
      setStage("polling");
    } catch {
      setStage("failed");
      setError("Network error. Please check your connection and try again.");
    }
  }, [phone, amount]);

  useEffect(() => {
    if (stage !== "polling" || !pollRef) return;

    if (pollCount > MAX_POLLS) {
      setStage("failed");
      setError(
        `No confirmation received after 2 minutes.${lastRawStatus ? ` Last status: "${lastRawStatus}".` : ""} If M-Pesa deducted funds, quote reference ${externalRef} when contacting support.`
      );
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/payhero/status?ref=${encodeURIComponent(pollRef)}`);
        const data = await res.json() as { status?: string };
        const s = (data.status || "PENDING").toUpperCase();
        if (s !== "PENDING") setLastRawStatus(s);

        if (s === "SUCCESS") {
          paidAt.current = new Date();
          setStage("success");
          setTimeout(() => onSuccess(externalRef), 1200);
        } else if (s === "FAILED") {
          setStage("failed");
          setError("Payment was cancelled or declined. Please try again.");
        } else {
          setPollCount((c) => c + 1);
        }
      } catch {
        setPollCount((c) => c + 1);
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [stage, pollRef, pollCount, onSuccess, lastRawStatus, externalRef]);

  const reset = () => {
    setStage("idle");
    setError("");
    setPollRef("");
    setPollCount(0);
    setLastRawStatus("");
  };

  const handleCancel = () => {
    setPollRef("");
    setPollCount(0);
    setLastRawStatus("");
    setStage("failed");
    setError(
      `Transaction cancelled. If M-Pesa already deducted KES ${amount}, quote reference ${externalRef} when contacting support.`
    );
  };

  const secondsWaited = pollCount * (POLL_INTERVAL_MS / 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand mb-0.5">
              Secure Payment
            </p>
            <h2 className="font-heading font-bold text-base leading-tight">{service}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={stage === "polling" || stage === "pushing"}
            className="text-text-muted hover:text-foreground transition-colors p-1 disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Amount */}
          <div className="flex items-center justify-between bg-brand-light rounded-xl px-4 py-3">
            <span className="text-xs text-text-secondary font-medium">Amount</span>
            <span className="font-heading font-extrabold text-2xl text-brand">KES {amount}</span>
          </div>

          {/* ── IDLE / FAILED ── */}
          {(stage === "idle" || stage === "failed") && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                  M-Pesa Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handlePay()}
                    placeholder="07XX XXX XXX"
                    autoFocus
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {stage === "failed" && (
                <button onClick={reset} className="text-xs text-brand underline underline-offset-2">
                  ← Try again
                </button>
              )}

              <button
                onClick={handlePay}
                className={cn(buttonVariants(), "w-full bg-brand hover:bg-brand-mid text-white gap-2")}
              >
                <Smartphone className="w-4 h-4" />
                Pay KES {amount} via M-Pesa
              </button>
            </>
          )}

          {/* ── PUSHING ── */}
          {stage === "pushing" && (
            <div className="flex flex-col items-center py-5 gap-3">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
              <p className="text-sm font-medium">Sending M-Pesa prompt…</p>
              <p className="text-xs text-text-muted">This usually takes a few seconds</p>
            </div>
          )}

          {/* ── POLLING ── */}
          {stage === "polling" && (
            <div className="flex flex-col items-center py-3 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold">Check your phone</p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Enter your M-Pesa PIN to confirm payment of{" "}
                  <strong>KES {amount}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Waiting for M-Pesa confirmation… ({secondsWaited}s)
              </div>
              {lastRawStatus && (
                <span className="text-[10px] bg-background border border-border rounded px-2 py-0.5 font-mono text-text-muted">
                  Status: {lastRawStatus}
                </span>
              )}
              <button
                onClick={handleCancel}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-xs w-full border-red-300 text-red-600 hover:bg-red-50 gap-1.5 mt-1"
                )}
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel transaction
              </button>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {stage === "success" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-green-700">Payment confirmed!</p>
              </div>

              {/* Receipt */}
              <div className="bg-background rounded-xl border border-border p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-text-muted font-semibold uppercase tracking-wider mb-1">
                  <Receipt className="w-3.5 h-3.5" /> Receipt
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Service</span>
                  <span className="font-medium text-right max-w-[55%] leading-tight">{service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Amount</span>
                  <span className="font-semibold text-brand">KES {amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Phone</span>
                  <span className="font-medium">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Reference</span>
                  <span className="font-mono text-[10px]">{externalRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Date</span>
                  <span className="font-medium">{formatTime(paidAt.current)}</span>
                </div>
              </div>

              <p className="text-[10px] text-text-muted text-center">
                Preparing your download…
              </p>
            </div>
          )}

          <p className="text-[10px] text-text-muted text-center pb-1">
            Powered by PayHero · M-Pesa payments are secure and instant
          </p>
        </div>
      </div>
    </div>
  );
}
