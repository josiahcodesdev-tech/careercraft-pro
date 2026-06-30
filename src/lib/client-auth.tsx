"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

interface ClientAuthCtx {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, phone: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const Ctx = createContext<ClientAuthCtx>({
  user: null,
  session: null,
  isLoading: true,
  login: async () => "Not initialized",
  register: async () => "Not initialized",
  logout: async () => {},
});

export function useClientAuth() {
  return useContext(Ctx);
}

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const register = useCallback(async (name: string, email: string, phone: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, full_name: name, phone });
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, isLoading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}
