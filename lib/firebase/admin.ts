import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

// Used by server-only scripts (seeding) and, later, server-side route
// handlers. Against the local emulator, no real credentials are needed —
// FIRESTORE_EMULATOR_HOST makes the Admin SDK talk to the emulator instead
// of production. For a real project, set GOOGLE_APPLICATION_CREDENTIALS or
// the FIREBASE_SERVICE_ACCOUNT_* env vars.
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID ?? "amlakms-dev";

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      projectId,
    });
  }

  return initializeApp({ projectId });
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
