"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAdminAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.replace("/admin");
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const ok = login(email, password);
    if (ok) {
      router.replace("/admin");
    } else {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B2838] px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-black text-white mb-1">
            CareerCraft Pro
          </h1>
          <p className="text-sm text-white/40">Admin Panel</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="font-heading text-lg font-extrabold tracking-tight mb-1">
            Sign in
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Enter your credentials to access the admin dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="josiahcodes.dev@gmail.com"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-mid text-white font-semibold"
            >
              Sign in →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
