// Drop-in replacement for the slice of "firebase/auth" this app uses, backed
// by lib/demo/store.ts. Only bundled in the static demo build.
import { installDemoApi } from "./api-mock";
import { currentUid, emailForUid, getDocData, signIn, signOutUser, subscribeAuth } from "./store";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  getIdToken(): Promise<string>;
}
export interface Auth {
  readonly currentUser: User | null;
}

function buildUser(uid: string | null): User | null {
  if (!uid) return null;
  return {
    uid,
    email: emailForUid(uid),
    displayName: (getDocData("users", uid)?.name as string | undefined) ?? null,
    getIdToken: async () => `demo-token:${uid}`,
  };
}

const AUTH: Auth = {
  get currentUser() {
    return buildUser(currentUid());
  },
};

// /api/* routes don't exist on a static host — see lib/demo/api-mock.ts.
installDemoApi();

export function getAuth(): Auth {
  return AUTH;
}
export function connectAuthEmulator() {}

export function onAuthStateChanged(_auth: Auth, cb: (user: User | null) => void): () => void {
  let active = true;
  const push = () => {
    if (active) cb(buildUser(currentUid()));
  };
  const t = setTimeout(push, 0);
  const unsub = subscribeAuth(push);
  return () => {
    active = false;
    clearTimeout(t);
    unsub();
  };
}

export async function signInWithEmailAndPassword(_auth: Auth, email: string, password: string) {
  signIn(email, password);
  return { user: buildUser(currentUid())! };
}

export async function signOut(_auth: Auth) {
  signOutUser();
}
