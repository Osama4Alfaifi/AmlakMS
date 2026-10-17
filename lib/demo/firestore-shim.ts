// Drop-in replacement for the slice of "firebase/firestore" this app uses,
// backed by lib/demo/store.ts. Only ever bundled in the static demo build
// (next.config.ts aliases "firebase/firestore" here) — never in the real app.
import { getDocData, listDocs, newId, patchDoc, removeDoc, subscribe, writeDoc } from "./store";

type DocData = Record<string, unknown>;

export interface Firestore {
  readonly type: "firestore";
}
export interface CollectionReference {
  readonly type: "collection";
  readonly id: string;
  readonly path: string;
}
export interface DocumentReference {
  readonly type: "document";
  readonly id: string;
  readonly path: string;
  readonly parent: CollectionReference;
}
interface Constraint {
  field: string;
  op: string;
  value: unknown;
}
export interface Query {
  readonly type: "query";
  readonly collection: CollectionReference;
  readonly constraints: Constraint[];
}
type QueryLike = CollectionReference | Query;

export interface DocumentSnapshot {
  id: string;
  ref: DocumentReference;
  exists(): boolean;
  data(): DocData | undefined;
}
export interface QuerySnapshot {
  docs: DocumentSnapshot[];
  size: number;
  empty: boolean;
}

const DB: Firestore = { type: "firestore" };

export function getFirestore(): Firestore {
  return DB;
}
export function initializeFirestore(): Firestore {
  return DB;
}
export function connectFirestoreEmulator() {}

export function collection(_db: Firestore, name: string): CollectionReference {
  return { type: "collection", id: name, path: name };
}

export function doc(db: Firestore, name: string, id: string): DocumentReference {
  return { type: "document", id, path: `${name}/${id}`, parent: collection(db, name) };
}

export function where(field: string, op: string, value: unknown): Constraint {
  return { field, op, value };
}

export function query(source: QueryLike, ...constraints: Constraint[]): Query {
  const base = source.type === "query" ? source : { type: "query" as const, collection: source, constraints: [] };
  return { type: "query", collection: base.collection, constraints: [...base.constraints, ...constraints] };
}

function matches(data: DocData, c: Constraint): boolean {
  const v = data[c.field];
  switch (c.op) {
    case "==":
      return v === c.value;
    case "!=":
      return v !== c.value;
    case "in":
      return Array.isArray(c.value) && c.value.includes(v);
    case "array-contains":
      return Array.isArray(v) && v.includes(c.value);
    default:
      throw new Error(`Demo Firestore: unsupported where() operator "${c.op}"`);
  }
}

function docSnapshot(col: string, id: string, data: DocData | undefined): DocumentSnapshot {
  return {
    id,
    ref: doc(DB, col, id),
    exists: () => data !== undefined,
    data: () => data,
  };
}

function runQuery(q: QueryLike): QuerySnapshot {
  const { collection: ref, constraints } = q.type === "query" ? q : { collection: q, constraints: [] as Constraint[] };
  const docs = listDocs(ref.id)
    .filter((d) => constraints.every((c) => matches(d.data, c)))
    .map((d) => docSnapshot(ref.id, d.id, d.data));
  return { docs, size: docs.length, empty: docs.length === 0 };
}

export function onSnapshot(
  target: QueryLike | DocumentReference,
  next: (snap: never) => void,
  error?: (err: Error) => void
): () => void {
  const col = target.type === "document" ? target.parent.id : target.type === "query" ? target.collection.id : target.id;
  let active = true;
  const push = () => {
    if (!active) return;
    try {
      if (target.type === "document") {
        const [colName, id] = target.path.split("/");
        (next as (s: DocumentSnapshot) => void)(docSnapshot(colName, id, getDocData(colName, id)));
      } else {
        (next as (s: QuerySnapshot) => void)(runQuery(target));
      }
    } catch (err) {
      error?.(err as Error);
    }
  };
  // Async first delivery, like the real SDK — consumers set loading state in
  // effects and expect the callback after the subscribe call returns.
  const t = setTimeout(push, 0);
  const unsub = subscribe(col, push);
  return () => {
    active = false;
    clearTimeout(t);
    unsub();
  };
}

export async function getDocs(q: QueryLike): Promise<QuerySnapshot> {
  return runQuery(q);
}

export async function getDoc(ref: DocumentReference): Promise<DocumentSnapshot> {
  const [col, id] = ref.path.split("/");
  return docSnapshot(col, id, getDocData(col, id));
}

export async function addDoc(ref: CollectionReference, data: DocData): Promise<DocumentReference> {
  const id = newId(ref.id);
  writeDoc(ref.id, id, data);
  return doc(DB, ref.id, id);
}

export async function setDoc(ref: DocumentReference, data: DocData, opts?: { merge?: boolean }) {
  const [col, id] = ref.path.split("/");
  writeDoc(col, id, data, opts);
}

export async function updateDoc(ref: DocumentReference, patch: DocData) {
  const [col, id] = ref.path.split("/");
  patchDoc(col, id, patch);
}

export async function deleteDoc(ref: DocumentReference) {
  const [col, id] = ref.path.split("/");
  removeDoc(col, id);
}

export function writeBatch(_db: Firestore) {
  const ops: (() => void)[] = [];
  const batch = {
    set(ref: DocumentReference, data: DocData, opts?: { merge?: boolean }) {
      ops.push(() => void setDoc(ref, data, opts));
      return batch;
    },
    update(ref: DocumentReference, patch: DocData) {
      ops.push(() => void updateDoc(ref, patch));
      return batch;
    },
    delete(ref: DocumentReference) {
      ops.push(() => void deleteDoc(ref));
      return batch;
    },
    async commit() {
      ops.forEach((op) => op());
    },
  };
  return batch;
}
