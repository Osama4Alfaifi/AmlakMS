"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

// Falls back to a demo config so the app runs against the local Firestore
// emulator with zero setup. Set the NEXT_PUBLIC_FIREBASE_* env vars (see
// .env.local.example) and NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false to point
// at a real Firebase project for production.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "amlakms-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "amlakms-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "amlakms-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:000000000000:web:0000000000000000000000",
};

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "false";

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

declare global {
  // eslint-disable-next-line no-var
  var __amlakmsEmulatorConnected: boolean | undefined;
}

export function getDb(): Firestore {
  const app = getFirebaseApp();
  // Optional fields (vendorName, notes, ...) are omitted with `value ||
  // undefined` at call sites — the Firestore client SDK rejects `undefined`
  // field values by default, so this setting is required for those writes
  // to succeed when the optional field is left blank.
  let db: Firestore;
  try {
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    db = getFirestore(app);
  }
  if (useEmulator && typeof window !== "undefined" && !globalThis.__amlakmsEmulatorConnected) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    globalThis.__amlakmsEmulatorConnected = true;
  }
  return db;
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  if (useEmulator && typeof window !== "undefined" && !globalThis.__amlakmsEmulatorConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return auth;
}
