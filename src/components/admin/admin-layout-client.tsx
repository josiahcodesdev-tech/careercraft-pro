"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/cv-writing": "CV Writing",
  "/admin/cv-writing/new": "New CV",
  "/admin/interview-coaching": "Interview Coaching",
  "/admin/interview-coaching/new": "New Interview Prep",
  "/admin/proposals": "Proposals & Grants",
  "/admin/enquiries": "Enquiries",
  "/admin/opportunities": "Opportunities",
};

function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAdminAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 transition-colors hover:bg-background lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-lg font-extrabold tracking-tight">{pageTitles[pathname] || "Admin"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">J</div>
            <button onClick={logout} className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-red-500">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider><AdminShell>{children}</AdminShell></AdminAuthProvider>;
}
