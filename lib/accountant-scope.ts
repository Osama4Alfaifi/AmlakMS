"use client";

import { useEffect, useState } from "react";
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

// Shared by every accountant-facing list page (contracts/expenses/
// properties/buildings/the dashboard/audit-log's reminders) so an
// accountant always browses exactly one assigned owner's data at a time —
// see components/accountant/OwnerScopeBanner.tsx for the matching UI.
export function useAccountantOwnerScope(): AccountantOwnerScope {
  const { user } = useAuth();
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

  const queryOwnerId: string | null | undefined = !isAccountant
    ? null
    : ownerIds.length === 0
    ? undefined
    : selectedOwnerId ?? undefined;

  const myOwners = isAccountant ? owners.filter((o) => ownerIds.includes(o.id)) : [];

  return { isAccountant, queryOwnerId, selectedOwnerId, selectOwner, myOwners };
}
