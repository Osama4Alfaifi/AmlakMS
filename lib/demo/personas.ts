// Single source of truth for the demo accounts — used by scripts/seed.ts
// (real Firebase / emulator) and by the static GitHub Pages demo's in-browser
// backend (lib/demo/store.ts), so both end up with identical logins.
import { owners, technicians, tenants } from "../mock-data";
import type { Role } from "../types";

export const DEMO_PASSWORD = "demo1234";

export interface Persona {
  id: string;
  role: Role;
  name: string;
  email: string;
  linkedId: string | null;
  ownerIds?: string[];
}

export function buildPersonas(): Persona[] {
  return [
    { id: "admin", role: "admin", name: "مدير النظام", email: "admin@amlakms.sa", linkedId: null },
    ...owners.map((o): Persona => ({ id: o.id, role: "owner", name: o.name, email: o.email ?? "", linkedId: o.id })),
    ...tenants.map((t): Persona => ({ id: t.id, role: "tenant", name: t.name, email: t.email ?? "", linkedId: t.id })),
    ...technicians.map(
      (t): Persona => ({ id: t.id, role: "technician", name: t.name, email: `${t.id}@amlakms.sa`, linkedId: t.id })
    ),
    // Assigned to only 2 of the 5 seeded owners (not all) — demonstrates
    // both a single accountant serving multiple owners, and the "owner
    // with no accountant" warning on app/admin/users for the rest.
    {
      id: "accountant-1",
      role: "accountant",
      name: "عبير الحارثي",
      email: "accountant@amlakms.sa",
      linkedId: null,
      ownerIds: ["own-1", "own-3"],
    },
    { id: "agent-1", role: "leasingAgent", name: "نايف السلمي", email: "agent@amlakms.sa", linkedId: null },
    { id: "maint-lead-1", role: "maintenanceStaff", name: "رائد الزهراني", email: "maintenance-lead@amlakms.sa", linkedId: null },
  ];
}
