"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Eye, LogOut } from "lucide-react";
import { useClientAuth } from "@/lib/client-auth";
import { supabase } from "@/lib/supabase/client";

interface CvRow {
  id: string;
  full_name: string | null;
  template: string | null;
  created_at: string;
  data: Record<string, unknown>;
}

interface PrepRow {
  id: string;
  candidate_name: string | null;
  role_title: string | null;
  created_at: string;
  data: Record<string, unknown>;
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useClientAuth();
  const router = useRouter();
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [preps, setPreps] = useState<PrepRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("cvs").select("id, full_name, template, created_at, data").order("created_at", { ascending: false }),
      supabase.from("interview_preps").select("id, candidate_name, role_title, created_at, data").order("created_at", { ascending: false }),
    ]).then(([cvRes, prepRes]) => {
      setCvs(cvRes.data ?? []);
      setPreps(prepRes.data ?? []);
      setLoadingData(false);
    });
  }, [user]);

  if (isLoading || !user) return null;

  return (
    <section className="py-16 px-8">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-heading text-2xl font-black tracking-tight">
              Your dashboard
            </h1>
            <p className="text-sm text-text-secondary mt-1">{user.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-sm text-text-muted hover:text-red-500 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {loadingData ? (
          <p className="text-sm text-text-muted">Loading your saved items…</p>
        ) : (
          <div className="space-y-10">
            <div>
              <h2 className="font-heading text-lg font-extrabold tracking-tight mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand" /> Your CVs
              </h2>
              {cvs.length === 0 ? (
                <p className="text-sm text-text-muted">No CVs saved yet. Build one from the CV Builder.</p>
              ) : (
                <div className="space-y-2">
                  {cvs.map((cv) => (
                    <div key={cv.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3.5">
                      <div>
                        <p className="font-medium text-sm">{cv.full_name || "Untitled CV"}</p>
                        <p className="text-xs text-text-muted">
                          {cv.template ? `${cv.template} · ` : ""}
                          {new Date(cv.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <button
                        onClick={() => setViewing(cv.data)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-heading text-lg font-extrabold tracking-tight mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand" /> Your Interview Preps
              </h2>
              {preps.length === 0 ? (
                <p className="text-sm text-text-muted">No interview preps saved yet. Generate one from Interview Coaching.</p>
              ) : (
                <div className="space-y-2">
                  {preps.map((prep) => (
                    <div key={prep.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3.5">
                      <div>
                        <p className="font-medium text-sm">{prep.candidate_name || "Untitled prep"}</p>
                        <p className="text-xs text-text-muted">
                          {prep.role_title ? `${prep.role_title} · ` : ""}
                          {new Date(prep.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <button
                        onClick={() => setViewing(prep.data)}
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
