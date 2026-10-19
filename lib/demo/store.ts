// In-browser stand-in for the Firestore + Firebase Auth backend, used only by
// the static GitHub Pages demo build (see next.config.ts — firebase/* imports
// are aliased to the shims in this folder). Seeded from lib/mock-data.ts and
// persisted to localStorage so edits survive a refresh; "reset" wipes it.
import {
  accountManagers,
  clients,
  contracts,
  documentLinks,
  expenses,
  invoices,
  maintenanceRequests,
  owners,
  properties,
  quotes,
  supportTickets,
  systemUsers,
  technicians,
  tenants,
  units,
  vendors,
  viewings,
} from "../mock-data";
import { buildPersonas, DEMO_PASSWORD } from "./personas";

type DocData = Record<string, unknown>;
type Collections = Record<string, Record<string, DocData>>;

interface Account {
  uid: string;
  password: string;
}

interface Persisted {
  collections: Collections;
  accounts: Record<string, Account>;
  uid: string | null;
}

const STORAGE_KEY = "amlakms-demo-v1";

// Collections whose docs have a printable page (app/*/[id]/print) — those
// routes are prerendered for a fixed set of ids at build time (a static host
// can't render a new id on demand), so new docs in these collections take the
// next free id from that pool instead of a random one.
export const PRINTABLE_COLLECTIONS = ["quotes", "invoices", "vouchers"];
export const PRINTABLE_ID_POOL_SIZE = 60;
export const printablePoolId = (n: number) => `demo-${n}`;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function seed(): Persisted {
  // The demo agent manages two owners so the new-lease flow has properties to
  // pick from; the shared personas (also used to seed Firebase) stay unassigned.
  const personas = buildPersonas().map((p) => (p.id === "agent-1" ? { ...p, ownerIds: ["own-1", "own-4"] } : p));
  const uidOf = (personaId: string) => `uid-${personaId}`;
  const adminUid = uidOf("admin");
  const tenantUidByName = new Map(tenants.map((t) => [t.name, uidOf(t.id)]));
  const ownerIdByPropertyId = new Map(properties.map((p) => [p.id, p.ownerId]));

  const toMap = (items: { id: string }[]): Record<string, DocData> =>
    Object.fromEntries(items.map(({ id, ...rest }) => [id, clone(rest) as DocData]));

  const collections: Collections = {
    owners: toMap(owners),
    properties: toMap(properties),
    tenants: toMap(tenants),
    contracts: toMap(contracts),
    clients: toMap(clients),
    invoices: toMap(invoices),
    quotes: toMap(quotes),
    technicians: toMap(technicians),
    expenses: toMap(expenses),
    accountManagers: toMap(accountManagers),
    systemUsers: toMap(systemUsers),
    units: toMap(units),
    vendors: toMap(vendors),
    viewings: toMap(viewings),
    documentLinks: toMap(documentLinks),
    supportTickets: toMap(
      supportTickets.map((t) => ({ ...t, createdByUid: tenantUidByName.get(t.from) ?? adminUid }))
    ),
    maintenanceRequests: toMap(
      maintenanceRequests.map((m) => ({
        ...m,
        createdByUid: tenantUidByName.get(m.tenantName) ?? adminUid,
        ownerId: ownerIdByPropertyId.get(m.propertyId) ?? null,
      }))
    ),
    users: toMap(
      personas.map((p) => ({
        id: uidOf(p.id),
        role: p.role,
        name: p.name,
        email: p.email,
        linkedId: p.linkedId,
        ...(p.ownerIds ? { ownerIds: p.ownerIds } : {}),
      }))
    ),
    vouchers: {},
    auditLogs: {},
    roles: {},
    settings: {},
  };

  const accounts = Object.fromEntries(
    personas.map((p) => [p.email.toLowerCase(), { uid: uidOf(p.id), password: DEMO_PASSWORD }])
  );

  return { collections, accounts, uid: null };
}

let state: Persisted | null = null;
let idCounter = 0;
const listeners = new Map<string, Set<() => void>>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function load(): Persisted {
  if (state) return state;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      state = JSON.parse(raw) as Persisted;
      return state;
    }
  } catch {
    // Corrupt or blocked storage — fall through to a fresh seed.
  }
  state = seed();
  return state;
}

function persist() {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota/blocked storage — the demo still works, it just won't survive a refresh.
    }
  }, 50);
}

function emit(collection: string) {
  listeners.get(collection)?.forEach((fn) => fn());
}

export function subscribe(collection: string, fn: () => void): () => void {
  let set = listeners.get(collection);
  if (!set) listeners.set(collection, (set = new Set()));
  set.add(fn);
  return () => set.delete(fn);
}

export function listDocs(collection: string): { id: string; data: DocData }[] {
  const col = load().collections[collection] ?? {};
  return Object.entries(col).map(([id, data]) => ({ id, data: clone(data) }));
}

export function getDocData(collection: string, id: string): DocData | undefined {
  const data = load().collections[collection]?.[id];
  return data ? clone(data) : undefined;
}

export function newId(collection: string): string {
  const col = load().collections[collection] ?? {};
  if (PRINTABLE_COLLECTIONS.includes(collection)) {
    for (let n = 1; n <= PRINTABLE_ID_POOL_SIZE; n++) {
      if (!col[printablePoolId(n)]) return printablePoolId(n);
    }
  }
  return `d${Date.now().toString(36)}${(idCounter++).toString(36)}`;
}

export function writeDoc(collection: string, id: string, data: DocData, opts?: { merge?: boolean }) {
  const s = load();
  const col = (s.collections[collection] ??= {});
  const next = clone(data);
  col[id] = opts?.merge ? { ...(col[id] ?? {}), ...next } : next;
  persist();
  emit(collection);
}

export function patchDoc(collection: string, id: string, patch: DocData) {
  const existing = load().collections[collection]?.[id];
  if (!existing) throw Object.assign(new Error(`No document to update: ${collection}/${id}`), { code: "not-found" });
  writeDoc(collection, id, patch, { merge: true });
}

export function removeDoc(collection: string, id: string) {
  const col = load().collections[collection];
  if (col && id in col) {
    delete col[id];
    persist();
    emit(collection);
  }
}

// --- auth ---------------------------------------------------------------

const authListeners = new Set<() => void>();

export function subscribeAuth(fn: () => void): () => void {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

export function currentUid(): string | null {
  return load().uid;
}

export function signIn(email: string, password: string): string {
  const s = load();
  const account = s.accounts[email.trim().toLowerCase()];
  if (!account || account.password !== password) {
    throw Object.assign(new Error("Invalid credentials"), { code: "auth/invalid-credential" });
  }
  s.uid = account.uid;
  persist();
  authListeners.forEach((fn) => fn());
  return account.uid;
}

export function signOutUser() {
  load().uid = null;
  persist();
  authListeners.forEach((fn) => fn());
}

export function emailForUid(uid: string): string | null {
  const profile = load().collections.users?.[uid];
  return (profile?.email as string | undefined) ?? null;
}

export function createAccount(email: string, password: string): string {
  const s = load();
  const key = email.trim().toLowerCase();
  if (s.accounts[key]) throw Object.assign(new Error("exists"), { code: "auth/email-already-exists" });
  const uid = `uid-${newId("users")}`;
  s.accounts[key] = { uid, password };
  persist();
  return uid;
}

export function hasAccount(email: string): boolean {
  return !!load().accounts[email.trim().toLowerCase()];
}

export function resetDemo() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  state = null;
}
