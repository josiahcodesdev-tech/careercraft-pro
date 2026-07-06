"use client";

import { useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/cv-writing": "CV Writing",
  "/admin/cv-writing/new": "New CV",
  "/admin/interview-coaching": "Interview Coaching",
  "/admin/interview-coaching/new": "New Interview Prep",
  "/admin/proposals": "Proposals & Grants",
  "/admin/enquiries": "Enquiries",
};

function AdminShell({ children }: { children: React.ReactNode }) {
  // No client-side auth check needed here — src/proxy.ts already redirects
  // any unauthenticated request to /admin/login before this ever renders.
  const { logout } = useAdminAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  const title = pageTitles[pathname] || "Admin";

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-background transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-heading text-lg font-extrabold tracking-tight">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold">
              J
            </div>
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
