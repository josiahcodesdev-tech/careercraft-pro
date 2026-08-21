import type { Metadata } from "next";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

export const metadata: Metadata = {
  title: "Admin — MyCareerCraft",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
