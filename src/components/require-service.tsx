"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
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
        if (data && data.length > 0) {
          setReady(true);
        } else {
          router.replace(`/dashboard?unlock=${serviceId}`);
        }
      });
  }, [isLoading, user, router, pathname, serviceId]);

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
