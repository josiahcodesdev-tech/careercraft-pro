"use client";

import { Suspense, useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Users, Eye, LogOut, Camera, Search, Lock, ArrowRight, Package, CheckCircle, Sparkles } from "lucide-react";
import { useClientAuth } from "@/lib/client-auth";
import { supabase } from "@/lib/supabase/client";
import { TOOL_SERVICES, BUNDLE_PRICE, INDIVIDUAL_TOTAL, hasServiceAccess } from "@/lib/services";

/* ─── types ─── */
interface Payment { tier: string; status: string; }
interface Item {
  id: string; type: "cv" | "prep";
  title: string; subtitle: string; date: string;
  data: Record<string, unknown>;
}

/* ─── country codes for phone input ─── */
const CODES = [
  { code: "+254", flag: "🇰🇪" }, { code: "+256", flag: "🇺🇬" }, { code: "+255", flag: "🇹🇿" },
  { code: "+251", flag: "🇪🇹" }, { code: "+250", flag: "🇷🇼" }, { code: "+1",   flag: "🇺🇸" },
  { code: "+44",  flag: "🇬🇧" }, { code: "+971", flag: "🇦🇪" }, { code: "+27",  flag: "🇿🇦" },
];

/* ─── service hub ─── */
function ServiceHub({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const unlockParam = searchParams.get("unlock");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [openPanel, setOpenPanel] = useState<string | null>(unlockParam);
  const [countryCode, setCountryCode] = useState("+254");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [payState, setPayState] = useState<"idle" | "waiting" | "success" | "error">("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPayments = useCallback(() => {
    supabase
      .from("payments")
      .select("tier, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .then(({ data }) => {
        setPayments(data ?? []);
        setLoadingPayments(false);
      });
  }, [userId]);

  useEffect(() => { refreshPayments(); }, [refreshPayments]);

  /* poll for payment confirmation */
  useEffect(() => {
    if (!pendingId || payState !== "waiting") return;

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/payments/status?id=${pendingId}`);
      if (!res.ok) return;
      const d = await res.json();
      if (d.status === "active") {
        setPayState("success");
        clearInterval(pollRef.current!);
        clearTimeout(timeoutRef.current!);
        refreshPayments();
      } else if (d.status === "failed") {
        setPayState("error");
        clearInterval(pollRef.current!);
        clearTimeout(timeoutRef.current!);
      }
    }, 3000);

    timeoutRef.current = setTimeout(() => {
      clearInterval(pollRef.current!);
      setPayState("error");
    }, 120_000);

    return () => {
      clearInterval(pollRef.current!);
      clearTimeout(timeoutRef.current!);
    };
  }, [pendingId, payState, refreshPayments]);

  async function pay(tier: string, price: number) {
    if (!phone.trim()) return;
    setPaying(true);
    setPayState("idle");
    setPayError(null);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `${countryCode}${phone.replace(/^0/, "")}`,
          amount: price,
          tier,
          userId,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        const detail = d?.detail ? ` (${JSON.stringify(d.detail)})` : "";
        setPayError((d?.error ?? "Payment failed. Please try again.") + detail);
        setPayState("error");
        return;
      }
      setPendingId(d.paymentId);
      setPayState("waiting");
    } catch {
      setPayError("Network error. Please check your connection.");
      setPayState("error");
    } finally {
      setPaying(false);
    }
  }

  function resetPanel(id: string) {
    if (openPanel === id) {
      setOpenPanel(null);
    } else {
      setOpenPanel(id);
      setPayState("idle");
      setPayError(null);
      setPendingId(null);
    }
  }

  const allActive = TOOL_SERVICES.every((s) => hasServiceAccess(payments, s.id));

  if (loadingPayments) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mb-10">
      <h2 className="font-heading text-lg font-extrabold tracking-tight mb-4">Your Services</h2>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {TOOL_SERVICES.map((svc) => {
          const active = hasServiceAccess(payments, svc.id);
          const isOpen = openPanel === svc.id;
          const Icon = svc.icon;

          return (
            <div
              key={svc.id}
              className={`rounded-2xl border flex flex-col transition-all ${
                active ? "bg-brand-light border-brand" : "bg-card border-border"
              }`}
            >
              <div className="p-5 flex-1">
                {/* Name + status */}
                <div className="flex items-start justify-between mb-1">
                  <p className="font-heading font-extrabold text-[16px] leading-tight">{svc.name}</p>
                  {active && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand bg-white/60 rounded-full px-2 py-0.5 ml-2 flex-shrink-0">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">{svc.description}</p>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-2xl font-black">{svc.price.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-text-muted ml-1">KES</span>
                  <span className="text-xs text-text-muted ml-1">/ one-time</span>
                </div>

                {/* CTA button */}
                {active ? (
                  <Link
                    href={svc.href}
                    className="flex items-center justify-center gap-1.5 h-9 w-full rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-mid transition-colors mb-4"
                  >
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => resetPanel(svc.id)}
                    className="flex items-center justify-center gap-1.5 h-9 w-full rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-brand hover:text-white transition-colors mb-4"
                  >
                    <Lock className="w-3.5 h-3.5" /> Get Access
                  </button>
                )}

                {/* Features list */}
                <ul className="flex flex-col gap-2">
                  {svc.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${active ? "text-brand" : "text-brand/60"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Inline payment panel */}
              {!active && isOpen && (
                <div className="border-t border-border mx-4 mb-4 pt-4">
                  <PaymentPanel
                    label={`Pay KES ${svc.price.toLocaleString()} — Get Access`}
                    price={svc.price}
                    tier={svc.id}
                    countryCode={countryCode}
                    setCountryCode={setCountryCode}
                    phone={phone}
                    setPhone={setPhone}
                    payState={payState}
                    payError={payError}
                    paying={paying}
                    onPay={pay}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bundle card */}
      {!allActive && (
        <div className="rounded-2xl border-2 border-gold bg-gold/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left: info */}
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-gold" />
                <p className="font-heading font-extrabold text-[16px]">Full Package</p>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gold text-white rounded-full px-2 py-0.5">Best Value</span>
              </div>
              <p className="text-xs text-text-secondary mb-3">All 3 services — CV Builder, Interview Prep & CV Transform</p>
              <div className="mb-4">
                <span className="text-2xl font-black">{BUNDLE_PRICE.toLocaleString()}</span>
                <span className="text-sm font-semibold text-text-muted ml-1">KES</span>
                <span className="text-xs text-text-muted line-through ml-2">KES {INDIVIDUAL_TOTAL.toLocaleString()}</span>
                <span className="text-xs font-semibold text-gold ml-2">Save KES {(INDIVIDUAL_TOTAL - BUNDLE_PRICE).toLocaleString()}</span>
              </div>
              <button
                onClick={() => resetPanel("bundle")}
                className="h-9 px-6 rounded-lg bg-gold hover:bg-gold/90 text-white text-sm font-semibold transition-colors"
              >
                Get Full Package
              </button>
            </div>

            {/* Right: features */}
            <ul className="flex flex-col gap-2 min-w-[200px]">
              {[
                "Everything in all 3 services",
                "9 professional CV templates",
                "AI-powered mock interviews",
                "ATS CV conversion & matching",
                "Unlimited PDF downloads",
                "Saved to your dashboard",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gold" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {openPanel === "bundle" && (
            <div className="border-t border-gold/20 mt-4 pt-4">
              <PaymentPanel
                label={`Pay KES ${BUNDLE_PRICE.toLocaleString()} — Get Full Package`}
                price={BUNDLE_PRICE}
                tier="bundle"
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                phone={phone}
                setPhone={setPhone}
                payState={payState}
                payError={payError}
                paying={paying}
                onPay={pay}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── reusable payment panel ─── */
function PaymentPanel({
  label, price, tier, countryCode, setCountryCode,
  phone, setPhone, payState, payError, paying, onPay,
}: {
  label: string; price: number; tier: string;
  countryCode: string; setCountryCode: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  payState: "idle" | "waiting" | "success" | "error";
  payError: string | null;
  paying: boolean;
  onPay: (tier: string, price: number) => void;
}) {
  if (payState === "success") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
        <CheckCircle className="w-4 h-4" /> Payment confirmed — service unlocked!
      </div>
    );
  }

  if (payState === "waiting") {
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin flex-shrink-0" />
        Check your phone for the M-Pesa prompt…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {payState === "error" && (
        <p className="text-xs text-red-500 font-medium">
          {payError ?? "Payment failed or timed out. Please try again."}
        </p>
      )}
      <p className="text-xs text-text-muted">Enter your M-Pesa number to pay <span className="font-semibold text-foreground">KES {price.toLocaleString()}</span></p>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring w-[90px] flex-shrink-0"
        >
          {CODES.map((c) => (
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
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
        />
      </div>
      <button
        disabled={paying || !phone.trim()}
        onClick={() => onPay(tier, price)}
        className="h-9 rounded-lg bg-brand hover:bg-brand-mid text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {paying ? "Sending prompt…" : label}
      </button>
      <p className="text-[11px] text-text-muted leading-relaxed">
        Your payment is processed securely by <span className="font-medium">PayHero</span>. Your M-Pesa number and transaction details are held by PayHero and are not stored by MyCareerCraft.
      </p>
    </div>
  );
}

/* ─── main dashboard ─── */
const selectClass = "h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors";

export default function DashboardPage() {
  const { user, isLoading, logout } = useClientAuth();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single().then(({ data }) => {
      setDisplayName(data?.full_name || user.email?.split("@")[0] || "User");
      setAvatarUrl(data?.avatar_url || null);
    });
    Promise.all([
      supabase.from("cvs").select("id, full_name, template, created_at, data").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("interview_preps").select("id, candidate_name, role_title, created_at, data").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([cvRes, prepRes]) => {
      const cvItems: Item[] = (cvRes.data ?? []).map((r) => ({
        id: r.id, type: "cv",
        title: r.full_name || "Untitled CV", subtitle: r.template || "",
        date: r.created_at, data: r.data,
      }));
      const prepItems: Item[] = (prepRes.data ?? []).map((r) => ({
        id: r.id, type: "prep",
        title: r.candidate_name || "Untitled prep", subtitle: r.role_title || "",
        date: r.created_at, data: r.data,
      }));
      setItems([...cvItems, ...prepItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoadingData(false);
    });
  }, [user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setAvatarUrl(publicUrl + `?t=${Date.now()}`);
    setUploading(false);
  }

  const filtered = useMemo(() => {
    let result = items;
    if (typeFilter !== "all") result = result.filter((i) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q));
    }
    return sortOrder === "oldest"
      ? [...result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [items, typeFilter, search, sortOrder]);

  if (isLoading || !user) return null;

  return (
    <section className="py-16 px-8">
      <div className="max-w-[960px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-11 h-11 rounded-full flex-shrink-0 group"
              title="Change photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-white font-bold text-base">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-4 h-4 text-white" />}
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div>
              <h1 className="font-heading text-xl font-black tracking-tight">{displayName}</h1>
              <p className="text-xs text-text-muted">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="text-sm text-text-muted hover:text-red-500 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Services hub */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          </div>
        }>
          <ServiceHub userId={user.id} />
        </Suspense>

        {/* Recent activity */}
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-tight mb-4">Recent Activity</h2>

          <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs text-text-muted font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Name, role, template…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted font-medium">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
                <option value="all">All</option>
                <option value="cv">CVs</option>
                <option value="prep">Interview Preps</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted font-medium">Sort</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={selectClass}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setSortOrder("newest"); }}
              className="h-9 px-4 rounded-lg border border-border bg-background text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              Reset
            </button>
          </div>

          {!loadingData && (
            <p className="text-xs text-text-muted mb-3">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
              {(search || typeFilter !== "all") && " matching filters"}
            </p>
          )}

          {loadingData ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-text-muted">
              {items.length === 0
                ? "No activity yet — use a service above to get started."
                : "No items match your filters."}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                      {item.type === "cv"
                        ? <FileText className="w-4 h-4 text-brand" />
                        : <Users className="w-4 h-4 text-brand" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-text-muted">
                        {item.subtitle ? `${item.subtitle} · ` : ""}
                        {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewing(item.data)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewing(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[700px] max-h-[85vh] mx-4 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-heading text-lg font-extrabold tracking-tight">
                {(viewing.fullName as string) || (viewing.candidateName as string) || "Preview"}
              </h2>
              <button onClick={() => setViewing(null)} className="text-text-muted hover:text-foreground text-xl px-2">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-xs whitespace-pre-wrap text-text-secondary">
                {JSON.stringify(viewing, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
