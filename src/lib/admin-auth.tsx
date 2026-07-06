"use client";

import { createContext, useContext, useCallback } from "react";

interface AdminAuthCtx {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AdminAuthCtx>({
  login: async () => false,
  logout: async () => {},
});

export function useAdminAuth() {
  return useContext(Ctx);
}

// Real gatekeeping now happens server-side in src/proxy.ts, which checks a
// signed httpOnly session cookie before any /admin page or /api/admin route
// is reached. This provider is just a thin client for the login/logout API.
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.ok;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }, []);

  return <Ctx.Provider value={{ login, logout }}>{children}</Ctx.Provider>;
}
