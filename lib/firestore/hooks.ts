"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where, type Query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import type {
  AccountManager,
  AppSettings,
  AuditLog,
  Client,
  Contract,
  CustomRole,
  DocumentLink,
  Expense,
  Invoice,
  MaintenanceRequest,
  Owner,
  Property,
  Quote,
  SupportTicket,
  SystemUser,
  Technician,
  Tenant,
  Unit,
  UserProfile,
  Vendor,
  Viewing,
  Voucher,
} from "@/lib/types";

// Firestore rules require an authenticated request. On a fresh page load,
// Firebase Auth needs a moment to rehydrate its persisted session before
// `auth.currentUser` is set — if a listener subscribes before that, the
// very first request goes out unauthenticated, gets permission-denied, and
// (unlike a transient network error) never auto-retries once auth is ready.
// This waits for the first real auth state before subscribing to anything.
function useAuthUid(): string | null | undefined {
  const [uid, setUid] = useState<string | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), (user) => setUid(user?.uid ?? null)), []);

  return uid;
}

interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

// IMPORTANT: a Firestore `list` rule must hold for the query as issued, not
// per returned document — Firestore does not filter results down to "the
// ones you're allowed to see", it either allows or denies the whole query.
// An unconstrained `collection(db, name)` read only works for roles whose
// access doesn't depend on document data (admin via the wildcard rule,
// technician via a role check that's true regardless of the document).
// Anyone whose access depends on a field on the document (createdByUid,
// ownerId, category, ...) MUST issue a query with a matching `where()` so
// Firestore can prove the rule holds for every possible result — see the
// scoped hooks below and firestore.rules.
function useFirestoreQuery<T>(name: string, constraint: { field: string; value: string } | null | undefined): CollectionState<T> {
  const uid = useAuthUid();
  const [state, setState] = useState<CollectionState<T>>({ data: [], loading: true, error: null });
  // undefined and null both collapse to the same `constraint?.field`/
  // `constraint?.value` (both undefined), so a caller re-rendering from
  // "don't fetch yet" (undefined — e.g. role not resolved) to "unconstrained
  // fetch" (null — e.g. role resolved to admin) previously left the effect's
  // dependency array unchanged, and the subscription never (re)started. This
  // tag makes that transition visible to the dependency array.
  const constraintState = constraint === undefined ? "pending" : constraint === null ? "unconstrained" : "scoped";

  useEffect(() => {
    if (!uid || constraint === undefined) {
      setState({ data: [], loading: uid === undefined || constraint === undefined, error: null });
      return;
    }
    const q: Query = constraint
      ? query(collection(getDb(), name), where(constraint.field, "==", constraint.value))
      : collection(getDb(), name);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        setState({ data, loading: false, error: null });
      },
      (err) => {
        console.error(`Firestore subscription error (${name}):`, err);
        setState((s) => ({ ...s, loading: false, error: err.message }));
      }
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, uid, constraintState, constraint?.field, constraint?.value]);

  return state;
}

function useFirestoreCollection<T>(name: string): CollectionState<T> {
  return useFirestoreQuery<T>(name, null);
}

export function useProperties() {
  return useFirestoreCollection<Property>("properties");
}
export function useOwners() {
  return useFirestoreCollection<Owner>("owners");
}
export function useTenants() {
  return useFirestoreCollection<Tenant>("tenants");
}
export function useContracts() {
  return useFirestoreCollection<Contract>("contracts");
}
export function useClients() {
  return useFirestoreCollection<Client>("clients");
}
export function useInvoices() {
  return useFirestoreCollection<Invoice>("invoices");
}
export function useQuotes() {
  return useFirestoreCollection<Quote>("quotes");
}
export function useTechnicians() {
  return useFirestoreCollection<Technician>("technicians");
}
export function useAccountManagers() {
  return useFirestoreCollection<AccountManager>("accountManagers");
}
export function useSystemUsers() {
  return useFirestoreCollection<SystemUser>("systemUsers");
}

// Unconstrained — only readable by admin (wildcard rule) and technicians
// (role check that holds regardless of document data). Do not use for
// owner/tenant views; use the scoped variants below instead.
export function useMaintenanceRequests() {
  return useFirestoreCollection<MaintenanceRequest>("maintenanceRequests");
}
export function useSupportTickets() {
  return useFirestoreCollection<SupportTicket>("supportTickets");
}
// Unconstrained — admin only (owner must use useOwnerExpenses below).
export function useExpenses() {
  return useFirestoreCollection<Expense>("expenses");
}

// Reference data — readable by any signed-in account, same as properties.
export function useUnits() {
  return useFirestoreCollection<Unit>("units");
}
export function useVendors() {
  return useFirestoreCollection<Vendor>("vendors");
}

// Admin-only tooling (see firestore.rules — no explicit rule, falls through
// to the admin wildcard; a non-admin session simply gets a permission error
// in this hook's error state, which no non-admin page calls into).
export function useViewings() {
  return useFirestoreCollection<Viewing>("viewings");
}
export function useDocumentLinks() {
  return useFirestoreCollection<DocumentLink>("documentLinks");
}
// Scoped by ownerId — see firestore.rules' owner-read scoping on
// documentLinks (app/owner/documents).
export function useOwnerDocumentLinks(ownerId: string | null | undefined) {
  return useFirestoreQuery<DocumentLink>("documentLinks", fieldConstraint("ownerId", ownerId));
}
export function useAuditLogs() {
  return useFirestoreCollection<AuditLog>("auditLogs");
}
// Resolves an actor's uid to their name/role for the audit log — admin-only
// (wildcard), used only from app/admin/audit-log.
export function useAllUserProfiles() {
  return useFirestoreCollection<UserProfile>("users");
}

// Accountant/admin only (see firestore.rules).
export function useVouchers() {
  return useFirestoreCollection<Voucher>("vouchers");
}

function fieldConstraint(
  field: string,
  value: string | null | undefined
): { field: string; value: string } | null | undefined {
  if (value == null) return value;
  return { field, value };
}

// Scoped to the current sender — safe for tenant/owner (any signed-in role).
export function useMyMaintenanceRequests(uid: string | null | undefined) {
  return useFirestoreQuery<MaintenanceRequest>("maintenanceRequests", fieldConstraint("createdByUid", uid));
}
export function useMySupportTickets(uid: string | null | undefined) {
  return useFirestoreQuery<SupportTicket>("supportTickets", fieldConstraint("createdByUid", uid));
}
// Pass `null` for an unconstrained fetch (admin — sees every actor's
// entries) or a uid to scope to that actor's own entries only (accountant —
// see firestore.rules and app/admin/audit-log).
export function useMyAuditLogs(uid: string | null | undefined) {
  return useFirestoreQuery<AuditLog>("auditLogs", fieldConstraint("actorUid", uid));
}

// Scoped to properties an owner owns. Passing `null` (not `undefined`)
// deliberately falls through to an unconstrained fetch — see
// useFirestoreQuery above — which is what lets the accountant pages reuse
// these same hooks for admin sessions (see lib/accountant-scope.ts).
export function useOwnerMaintenanceRequests(ownerId: string | null | undefined) {
  return useFirestoreQuery<MaintenanceRequest>("maintenanceRequests", fieldConstraint("ownerId", ownerId));
}
export function useOwnerExpenses(ownerId: string | null | undefined) {
  return useFirestoreQuery<Expense>("expenses", fieldConstraint("ownerId", ownerId));
}
export function useOwnerContracts(ownerId: string | null | undefined) {
  return useFirestoreQuery<Contract>("contracts", fieldConstraint("ownerId", ownerId));
}
export function useOwnerProperties(ownerId: string | null | undefined) {
  return useFirestoreQuery<Property>("properties", fieldConstraint("ownerId", ownerId));
}
export function useOwnerUnits(ownerId: string | null | undefined) {
  return useFirestoreQuery<Unit>("units", fieldConstraint("ownerId", ownerId));
}
// Scoped by ownerId — same field an owner's own linkedId matches, so this
// hook serves both the owner role (pass user.linkedId) and admin (pass null
// for an unconstrained fetch). See firestore.rules for the matching rule.
export function useOwnerQuotes(ownerId: string | null | undefined) {
  return useFirestoreQuery<Quote>("quotes", fieldConstraint("ownerId", ownerId));
}
export function useOwnerInvoices(ownerId: string | null | undefined) {
  return useFirestoreQuery<Invoice>("invoices", fieldConstraint("ownerId", ownerId));
}
export function useTenantInvoices(tenantId: string | null | undefined) {
  return useFirestoreQuery<Invoice>("invoices", fieldConstraint("tenantId", tenantId));
}

// Scoped to one ticket category — safe for technicians reading "الدعم الفني".
export function useSupportTicketsByCategory(category: string | null | undefined) {
  return useFirestoreQuery<SupportTicket>("supportTickets", fieldConstraint("category", category));
}

export function useFirestoreDoc<T>(name: string, id: string | undefined) {
  const uid = useAuthUid();
  const [data, setData] = useState<T | null | undefined>(undefined);

  useEffect(() => {
    if (!id || !uid) {
      setData(uid === undefined ? undefined : null);
      return;
    }
    setData(undefined);
    const unsub = onSnapshot(
      doc(getDb(), name, id),
      (snap) => setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null),
      (err) => {
        console.error(`Firestore doc subscription error (${name}/${id}):`, err);
        setData(null);
      }
    );
    return unsub;
  }, [name, id, uid]);

  return data;
}

// Single app-wide settings doc (settings/app) — company profile, branding,
// notification lead time, maintenance mode. See app/admin/settings.
export function useAppSettings() {
  return useFirestoreDoc<AppSettings>("settings", "app");
}

// Admin-defined custom roles — see app/admin/roles and firestore.rules'
// customCan(). Reference data, readable by any signed-in account.
export function useRoles() {
  return useFirestoreCollection<CustomRole>("roles");
}
export function useCustomRole(id: string | null | undefined) {
  return useFirestoreDoc<CustomRole>("roles", id ?? undefined);
}
