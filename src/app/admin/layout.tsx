"use client";

import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/cv-writing": "CV Writing",
  "/admin/interview-coaching": "Interview Coaching",
  "/admin/proposals": "Proposals & Grants",
  "/admin/enquiries": "Enquiries",
};

function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const pathname = usePathname();

  if (pathname === "/admin/login") return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const title = pageTitles[pathname] || "Admin";

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="font-heading text-lg font-extrabold tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted hidden sm:block">
              josiahcodes.dev@gmail.com
            </span>
            <button
              onClick={logout}
              className="text-xs text-text-muted hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
