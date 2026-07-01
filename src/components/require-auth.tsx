"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useClientAuth } from "@/lib/client-auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
