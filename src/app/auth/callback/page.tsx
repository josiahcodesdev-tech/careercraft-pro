"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase PKCE: the SDK detects ?code= in the URL and exchanges it automatically.
    // Listen for the resulting SIGNED_IN event then redirect.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.replace("/dashboard");
    });
    // Also handle the case where the exchange already completed synchronously.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="animate-pulse text-sm text-text-muted">Completing sign-in…</div>
    </div>
  );
}
