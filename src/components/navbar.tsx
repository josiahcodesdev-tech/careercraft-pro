"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, User } from "lucide-react";
import { useState } from "react";
import { useClientAuth } from "@/lib/client-auth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading } = useClientAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/92 backdrop-blur-md border-b border-border">
      <div className="max-w-[1100px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-extrabold text-brand tracking-tight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          MyCareerCraft
        </Link>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-8">
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
          {!isLoading && (
            <li>
              <Link
                href={user ? "/dashboard" : "/login"}
                className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
              >
                <User className="w-4 h-4" /> {user ? "Dashboard" : "Login"}
              </Link>
            </li>
          )}
          <li>
            <Link
              href="/contact"
              className={cn(buttonVariants({ size: "sm" }), "bg-brand hover:bg-brand-mid text-white")}
            >
              Get in touch
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
          {!isLoading && (
            <Link
              href={user ? "/dashboard" : "/login"}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium py-2 text-text-secondary"
            >
              <User className="w-4 h-4" /> {user ? "Dashboard" : "Login"}
            </Link>
          )}
          <Link
            href="/contact"
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
