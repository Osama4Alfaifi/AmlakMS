// Seeds the Firestore emulator with the same demo dataset the prototype
// used to read from lib/mock-data.ts, AND creates a real Firebase Auth
// account (Auth emulator) for every persona — admin, and every seeded
// owner/tenant/technician — so the app can be tested with real sign-in
// instead of the old mock role picker. Run with: npm run seed (both the
// Firestore and Auth emulators must already be running via npm run emulators).
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "amlakms-dev";

import { getAdminAuth, getAdminDb } from "../lib/firebase/admin";
import {
  accountManagers,
  clients,
  contracts,
  invoices,
  maintenanceRequests,
  owners,
  properties,
  quotes,
  supportTickets,
  systemUsers,
  technicians,
  tenants,
} from "../lib/mock-data";
import type { Role } from "../lib/types";

const DEMO_PASSWORD = "demo1234";

interface Persona {
  id: string;
  role: Role;
  name: string;
  email: string;
  linkedId: string | null;
}

async function seedCollection(name: string, items: { id: string }[]) {
  const db = getAdminDb();
  await Promise.all(items.map(({ id, ...rest }) => db.collection(name).doc(id).set(rest)));
  console.log(`  ✔ ${name} (${items.length})`);
}

async function upsertAuthUser(persona: Persona): Promise<string> {
  const auth = getAdminAuth();
  try {
    const existing = await auth.getUserByEmail(persona.email);
    await auth.updateUser(existing.uid, { password: DEMO_PASSWORD, displayName: persona.name });
    return existing.uid;
  } catch (err) {
    if ((err as { code?: string }).code === "auth/user-not-found") {
      const created = await auth.createUser({
        email: persona.email,
        password: DEMO_PASSWORD,
        displayName: persona.name,
      });
      return created.uid;
    }
    throw err;
  }
}

async function main() {
  console.log(`Seeding Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} ...`);

  await seedCollection("owners", owners);
  await seedCollection("properties", properties);
  await seedCollection("tenants", tenants);
  await seedCollection("contracts", contracts);
  await seedCollection("clients", clients);
  await seedCollection("invoices", invoices);
  await seedCollection("quotes", quotes);
  await seedCollection("technicians", technicians);
  await seedCollection("accountManagers", accountManagers);
  await seedCollection("systemUsers", systemUsers);

  const personas: Persona[] = [
    { id: "admin", role: "admin", name: "مدير النظام", email: "admin@amlakms.sa", linkedId: null },
    ...owners.map((o): Persona => ({ id: o.id, role: "owner", name: o.name, email: o.email, linkedId: o.id })),
    ...tenants.map((t): Persona => ({ id: t.id, role: "tenant", name: t.name, email: t.email, linkedId: t.id })),
    ...technicians.map(
      (t): Persona => ({ id: t.id, role: "technician", name: t.name, email: `${t.id}@amlakms.sa`, linkedId: t.id })
    ),
  ];

  console.log(`Creating ${personas.length} demo auth accounts (password: ${DEMO_PASSWORD}) ...`);
  const db = getAdminDb();
  const uidByPersonaId = new Map<string, string>();
  for (const persona of personas) {
    const uid = await upsertAuthUser(persona);
    uidByPersonaId.set(persona.id, uid);
    await db.collection("users").doc(uid).set({
      role: persona.role,
      name: persona.name,
      email: persona.email,
      linkedId: persona.linkedId,
    });
  }
  console.log(`  ✔ ${personas.length} auth accounts + profiles`);

  const adminUid = uidByPersonaId.get("admin")!;
  const tenantUidByName = new Map(tenants.map((t) => [t.name, uidByPersonaId.get(t.id)]));
  const ownerIdByPropertyId = new Map(properties.map((p) => [p.id, p.ownerId]));

  await seedCollection(
    "supportTickets",
    supportTickets.map((t) => ({ ...t, createdByUid: tenantUidByName.get(t.from) ?? adminUid }))
  );
  await seedCollection(
    "maintenanceRequests",
    maintenanceRequests.map((m) => ({
      ...m,
      createdByUid: tenantUidByName.get(m.tenantName) ?? adminUid,
      ownerId: ownerIdByPropertyId.get(m.propertyId) ?? null,
    }))
  );

  console.log("\nSeed complete. Demo accounts (all use password \"" + DEMO_PASSWORD + "\"):");
  console.log(`  admin@amlakms.sa`);
  owners.forEach((o) => console.log(`  ${o.email}  — مالك: ${o.name}`));
  tenants.forEach((t) => console.log(`  ${t.email}  — مستأجر: ${t.name}`));
  technicians.forEach((t) => console.log(`  ${t.id}@amlakms.sa  — فني: ${t.name}`));
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
