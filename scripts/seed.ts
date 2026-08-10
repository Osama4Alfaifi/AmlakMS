// Seeds the Firestore emulator with the same demo dataset the prototype
// used to read from lib/mock-data.ts, so the "shared database" experience
// starts populated. Run with: npm run seed (emulator must be running).
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "amlakms-dev";

import { getAdminDb } from "../lib/firebase/admin";
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

async function seedCollection(name: string, items: { id: string }[]) {
  const db = getAdminDb();
  await Promise.all(
    items.map(({ id, ...rest }) => db.collection(name).doc(id).set(rest))
  );
  console.log(`  ✔ ${name} (${items.length})`);
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
  await seedCollection("maintenanceRequests", maintenanceRequests);
  await seedCollection("supportTickets", supportTickets);
  await seedCollection("accountManagers", accountManagers);
  await seedCollection("users", systemUsers);
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
