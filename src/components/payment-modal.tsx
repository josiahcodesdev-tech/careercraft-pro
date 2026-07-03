"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface PaymentModalProps {
  service: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

type Stage = "idle" | "pushing" | "polling" | "success" | "failed";

function genRef(): string {
  return `MCC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const MAX_POLLS = 40; // 40 × 3s = 2 minutes

export function PaymentModal({ service, amount, onSuccess, onClose }: PaymentModalProps) {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");
  const [pollCount, setPollCount] = useState(0);

  const handlePay = useCallback(async () => {
    const raw = phone.trim();
    if (!raw) { setError("Enter your M-Pesa phone number."); return; }

    setError("");
    setStage("pushing");
    const reference = genRef();
    setRef(reference);

    try {
      const res = await fetch("/api/payhero/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: raw, amount, reference }),
      });
      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setStage("failed");
        setError(data.error || "Could not send payment request. Please check your number.");
        return;
      }

      setStage("polling");
      setPollCount(0);
    } catch {
      setStage("failed");
      setError("Network error. Please check your connection and try again.");
    }
  }, [phone, amount]);

  // Poll for payment status
  useEffect(() => {
    if (stage !== "polling" || !ref) return;

    if (pollCount > MAX_POLLS) {
      setStage("failed");
      setError("Payment timed out. Please try again.");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/payhero/status?ref=${encodeURIComponent(ref)}`);
        const data = await res.json() as { status?: string };
        const s = (data.status || "").toUpperCase();

        if (s === "SUCCESS" || s === "COMPLETE" || s === "COMPLETED") {
          setStage("success");
          setTimeout(onSuccess, 1000);
        } else if (s === "FAILED" || s === "CANCELLED" || s === "CANCELED") {
          setStage("failed");
          setError("Payment was cancelled or failed. Please try again.");
        } else {
          setPollCount((c) => c + 1);
        }
      } catch {
        setPollCount((c) => c + 1);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [stage, ref, pollCount, onSuccess]);

  const reset = () => {
    setStage("idle");
    setError("");
    setRef("");
    setPollCount(0);
  };

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
          {/* Amount pill */}
          <div className="flex items-center justify-between bg-brand-light rounded-xl px-4 py-3">
            <span className="text-xs text-text-secondary font-medium">Amount</span>
            <span className="font-heading font-extrabold text-2xl text-brand">KES {amount}</span>
          </div>

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
                  <p className="text-xs text-red-500 mt-1.5 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {error}
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
                className={cn(
                  buttonVariants(),
                  "w-full bg-brand hover:bg-brand-mid text-white gap-2"
                )}
              >
                <Smartphone className="w-4 h-4" />
                Pay KES {amount} via M-Pesa
              </button>
            </>
          )}

          {stage === "pushing" && (
            <div className="flex flex-col items-center py-5 gap-3">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
              <p className="text-sm font-medium text-center">Sending M-Pesa prompt...</p>
            </div>
          )}

          {stage === "polling" && (
            <div className="flex flex-col items-center py-4 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold">Check your phone</p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Enter your M-Pesa PIN to pay <strong>KES {amount}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Waiting for confirmation…
              </div>
            </div>
          )}

          {stage === "success" && (
            <div className="flex flex-col items-center py-4 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700">Payment confirmed!</p>
                <p className="text-xs text-text-muted mt-1">Preparing your download…</p>
              </div>
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
