"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useClientAuth } from "@/lib/client-auth";
import { hasAccess } from "@/lib/access";

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
    if (hasAccess(serviceId)) {
      setReady(true);
    } else {
      router.replace(`/dashboard?unlock=${serviceId}`);
    }
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
