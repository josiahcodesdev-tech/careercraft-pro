"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Eye, LogOut, Camera } from "lucide-react";
import { useClientAuth } from "@/lib/client-auth";
import { supabase } from "@/lib/supabase/client";

type Filter = "all" | "cv" | "prep";

interface Item {
  id: string;
  type: "cv" | "prep";
  title: string;
  subtitle: string;
  date: string;
  data: Record<string, unknown>;
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useClientAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (isLoading || !user) return null;

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <section className="py-16 px-8">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-11 h-11 rounded-full flex-shrink-0 group"
              title="Change photo"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-11 h-11 rounded-full object-cover"
                />
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
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
        <div className="flex items-center gap-2 mb-6">
          {(["all", "cv", "prep"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-brand text-white"
                  : "bg-card border border-border text-text-secondary hover:text-foreground"
              }`}
            >
              {f === "cv" && <FileText className="w-3.5 h-3.5" />}
              {f === "prep" && <Users className="w-3.5 h-3.5" />}
              {f === "all" ? "All" : f === "cv" ? "CVs" : "Interview Preps"}
              {f !== "all" && (
                <span className={`text-xs ${filter === f ? "text-white/70" : "text-text-muted"}`}>
                  {items.filter((i) => i.type === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loadingData ? (
          <p className="text-sm text-text-muted">Loading your saved items…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-text-muted">
            {filter === "cv"
              ? "No CVs saved yet. Build one from the CV Builder."
              : filter === "prep"
              ? "No interview preps saved yet. Generate one from Interview Coaching."
              : "No saved items yet."}
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
