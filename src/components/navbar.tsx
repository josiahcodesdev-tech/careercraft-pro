"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/cv-builder", label: "CV Builder" },
  { href: "/interview-prep", label: "Interview Prep" },
  { href: "/services", label: "Services" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#f5f3ee]/92 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 sm:px-8 2xl:h-28 2xl:max-w-[1840px] 2xl:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-xl font-extrabold tracking-tight text-[#173f31] sm:text-2xl"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          MyCareerCraft
        </Link>

        {/* Desktop */}
        <ul className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-foreground"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/cv-builder"
              className={cn(buttonVariants(), "h-11 rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-mid")}
            >
              Get started
            </Link>
          </li>
        </ul>

        {/* Mobile */}
        <button
          className="md:hidden p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-8 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium py-2 ${
                pathname === link.href ? "text-foreground" : "text-text-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cv-builder"
            onClick={() => setMobileOpen(false)}
            className={cn(buttonVariants({ size: "sm" }), "bg-brand hover:bg-brand-mid text-white w-full mt-2")}
          >
            Get in touch
          </Link>
        </div>
      )}
    </nav>
  );
}
