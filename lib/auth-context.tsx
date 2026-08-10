"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, SessionUser } from "./types";

const STORAGE_KEY = "amlakms.session";

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (role: Role, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: (role, name) => {
        const next = { role, name };
        setUser(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      logout: () => {
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireRole(role: Role) {
  return useRequireAuth([role]);
}

export function useRequireAuth(allow?: Role[]) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user || (allow && !allow.includes(user.role))) {
      router.replace(`/login${allow?.length === 1 ? `?role=${allow[0]}` : ""}`);
    }
  }, [ready, user, allow, router]);

  return { user, ready };
}
