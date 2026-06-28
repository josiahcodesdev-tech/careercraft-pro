"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_EMAIL = "josiahcodes.dev@gmail.com";
const ADMIN_PASSWORD = "admin123";
const AUTH_KEY = "careercraft_admin_auth";

interface AdminAuthCtx {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AdminAuthCtx>({
  isAuthenticated: false,
  isLoading: true,
  login: () => false,
  logout: () => {},
});

export function useAdminAuth() {
  return useContext(Ctx);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.loggedIn) setIsAuthenticated(true);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = useCallback((email: string, password: string) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, ts: Date.now() }));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    router.replace("/admin/login");
  }, [router]);

  return (
    <Ctx.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}
