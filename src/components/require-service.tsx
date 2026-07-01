"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClientAuth } from "@/lib/client-auth";
import { supabase } from "@/lib/supabase/client";

export function RequireService({
  serviceId,
  children,
}: {
  serviceId: string;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useClientAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/dashboard?unlock=${serviceId}`)}`
      );
      return;
    }

    supabase
      .from("payments")
      .select("id")
      .eq("user_id", user.id)
      .in("tier", [serviceId, "bundle"])
      .eq("status", "active")
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          router.replace(`/dashboard?unlock=${serviceId}`);
        } else {
          setChecking(false);
        }
      });
  }, [isLoading, user, serviceId, router]);

  if (isLoading || checking) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
