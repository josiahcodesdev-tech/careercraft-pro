"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Eye, LogOut, Camera, Search } from "lucide-react";
import { useClientAuth } from "@/lib/client-auth";
import { supabase } from "@/lib/supabase/client";

interface Item {
  id: string;
  type: "cv" | "prep";
  title: string;
  subtitle: string;
  date: string;
  data: Record<string, unknown>;
}

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

  // Filters
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
      supabase.from("cvs").select("id, full_name, template, created_at, data").order("created_at", { ascending: false }),
      supabase.from("interview_preps").select("id, candidate_name, role_title, created_at, data").order("created_at", { ascending: false }),
    ]).then(([cvRes, prepRes]) => {
      const cvItems: Item[] = (cvRes.data ?? []).map((r) => ({
        id: r.id,
        type: "cv",
        title: r.full_name || "Untitled CV",
        subtitle: r.template || "",
        date: r.created_at,
        data: r.data,
      }));
      const prepItems: Item[] = (prepRes.data ?? []).map((r) => ({
        id: r.id,
        type: "prep",
        title: r.candidate_name || "Untitled prep",
        subtitle: r.role_title || "",
        date: r.created_at,
        data: r.data,
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
    if (sortOrder === "oldest") result = [...result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    else result = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [items, typeFilter, search, sortOrder]);

  if (isLoading || !user) return null;

  return (
    <section className="py-16 px-8">
      <div className="max-w-[900px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
              <p className="text-xs text-text-muted">Your dashboard</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="text-sm text-text-muted hover:text-red-500 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-xs text-text-muted font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Name, role, template..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted font-medium">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              <option value="cv">CVs</option>
              <option value="prep">Interview Preps</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted font-medium">Sort</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={selectClass}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setSortOrder("newest"); }}
              className="h-9 px-4 rounded-lg border border-border bg-background text-sm text-text-secondary hover:text-foreground transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results count */}
        {!loadingData && (
          <p className="text-xs text-text-muted mb-3">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
            {(search || typeFilter !== "all") && " matching filters"}
          </p>
        )}

        {/* List */}
        {loadingData ? (
          <p className="text-sm text-text-muted">Loading your saved items…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-text-muted">No items match your filters.</p>
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
