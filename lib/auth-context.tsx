"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "./firebase/client";
import { logUserLogin } from "./firestore/mutations";
import type { Role, SessionUser, UserProfile } from "./types";

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // undefined = not resolved yet, null = signed out, User = signed in.
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  // Firestore users/{uid} doc carrying role + linkedId — the actual source
  // of truth for what this account can do (Firebase Auth only proves *who*
  // they are, not their role).
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), setFirebaseUser), []);

  useEffect(() => {
    if (!firebaseUser) {
      setProfile(firebaseUser === null ? null : undefined);
      return;
    }
    setProfile(undefined);
    const unsub = onSnapshot(
      doc(getDb(), "users", firebaseUser.uid),
      (snap) => setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null),
      (err) => {
        console.error("Failed to load user profile:", err);
        setProfile(null);
      }
    );
    return unsub;
  }, [firebaseUser]);

  const ready = firebaseUser !== undefined && (firebaseUser === null || profile !== undefined);

  const user: SessionUser | null =
    firebaseUser && profile
      ? {
          uid: firebaseUser.uid,
          role: profile.role,
          name: profile.name,
          email: profile.email,
          linkedId: profile.linkedId,
          ownerIds: profile.ownerIds ?? [],
          customRoleId: profile.customRoleId ?? null,
        }
      : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        void logUserLogin();
      },
      logout: async () => {
        await signOut(getFirebaseAuth());
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.uid, user?.role, user?.name, user?.ownerIds?.join(","), user?.customRoleId, ready]
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
