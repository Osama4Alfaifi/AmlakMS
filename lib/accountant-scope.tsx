"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOwners } from "@/lib/firestore/hooks";
import type { Owner } from "@/lib/types";

const STORAGE_KEY = "accountant-selected-owner";

export interface AccountantOwnerScope {
  isAccountant: boolean;
  // The ownerId to feed into useOwner*() hooks: null lets those hooks fall
  // through to an unconstrained fetch (every non-accountant role, unchanged
  // behavior); a string scopes to that owner; undefined means "don't fetch
  // yet" (accountant with no owners assigned, or selection not resolved).
  queryOwnerId: string | null | undefined;
  selectedOwnerId: string | null;
  selectOwner: (ownerId: string) => void;
  myOwners: Owner[];
}

function computeScope(): AccountantOwnerScope {
  const { user, ready } = useAuth();
  const { data: owners } = useOwners();
  const isAccountant = user?.role === "accountant";
  const ownerIds = isAccountant ? user?.ownerIds ?? [] : [];

  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAccountant) return;
    if (ownerIds.length === 0) {
      setSelectedOwnerId(null);
      return;
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    setSelectedOwnerId(stored && ownerIds.includes(stored) ? stored : ownerIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAccountant, ownerIds.join(",")]);

  function selectOwner(ownerId: string) {
    setSelectedOwnerId(ownerId);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, ownerId);
  }

  // Gated on `ready` first: consumers of this scope (useOwnerProperties,
  // useOwnerContracts, etc.) run before DashboardShell's own ready-check
  // takes effect, so without this an eventual accountant would briefly
  // resolve `!isAccountant` to true (role not loaded yet, not actually
  // confirmed non-accountant) and fire an unconstrained fetch that
  // firestore.rules now denies once their real role is known.
  const queryOwnerId: string | null | undefined = !ready
    ? undefined
    : !isAccountant
    ? null
    : ownerIds.length === 0
    ? undefined
    : selectedOwnerId ?? undefined;

  const myOwners = isAccountant ? owners.filter((o) => ownerIds.includes(o.id)) : [];

  return { isAccountant, queryOwnerId, selectedOwnerId, selectOwner, myOwners };
}

const AccountantScopeContext = createContext<AccountantOwnerScope | null>(null);

// Computed once in DashboardShell (which also renders the single
// OwnerScopeBanner instance) and shared from there — every page that reads
// scope.queryOwnerId needs the SAME selection the banner's dropdown drives,
// not an independent copy, or switching owners wouldn't update page data.
export function AccountantScopeProvider({ children }: { children: React.ReactNode }) {
  const scope = computeScope();
  return <AccountantScopeContext.Provider value={scope}>{children}</AccountantScopeContext.Provider>;
}

export function useAccountantOwnerScope(): AccountantOwnerScope {
  const ctx = useContext(AccountantScopeContext);
  if (!ctx) throw new Error("useAccountantOwnerScope must be used within AccountantScopeProvider (see DashboardShell)");
  return ctx;
}
