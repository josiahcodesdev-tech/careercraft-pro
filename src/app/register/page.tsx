"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClientAuth } from "@/lib/client-auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useClientAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const err = await register(name, email, phone, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <section className="py-20 px-8">
      <div className="max-w-[420px] mx-auto">
        <div className="bg-card border border-border rounded-2xl p-10">
          <h1 className="font-heading text-[22px] font-black tracking-tight mb-2">
            Create your account
          </h1>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            Save your CVs and interview preps and access them anytime from your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="text-sm font-semibold mb-1.5 block">
                Full name
              </label>
              <Input
                id="name"
                placeholder="Jane Kamau"
                required
                className="bg-background"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-semibold mb-1.5 block">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                required
                className="bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-semibold mb-1.5 block">
                Phone number (optional)
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 712 345 678"
                className="bg-background"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-semibold mb-1.5 block">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-background"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand hover:bg-brand-mid text-white font-semibold mt-1"
            >
              {submitting ? "Creating account…" : "Create account →"}
            </Button>
          </form>

          <p className="text-sm text-text-secondary text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
