// One-off reset: wipes the current demo properties (and everything that
// cascades from them) on the live project, then seeds two example
// multi-unit properties. Not part of the app — delete after running once.
import { getAdminDb } from "../lib/firebase/admin";
import type { Property, Unit } from "../lib/types";

const WIPE_COLLECTIONS = [
  "properties",
  "buildings",
  "units",
  "contracts",
  "tenants",
  "expenses",
  "maintenanceRequests",
  "viewings",
  "documentLinks",
];

async function wipeCollection(name: string) {
  const db = getAdminDb();
  const snap = await db.collection(name).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
  console.log(`  ✔ wiped ${name} (${snap.size})`);
}

function makeUnits(propertyId: string, ownerId: string, specs: { count: number; type: Unit["type"]; prefix: string; area: number; price: number; bedrooms: number; bathrooms: number; startFloor: number; perFloor: number }[]): Omit<Unit, "id">[] {
  const units: Omit<Unit, "id">[] = [];
  for (const spec of specs) {
    for (let i = 1; i <= spec.count; i++) {
      const floor = spec.startFloor + Math.floor((i - 1) / spec.perFloor);
      units.push({
        propertyId,
        ownerId,
        unitNumber: `${spec.prefix}${i}`,
        floor,
        type: spec.type,
        area: spec.area,
        bedrooms: spec.bedrooms,
        bathrooms: spec.bathrooms,
        price: spec.price,
        listingType: "إيجار",
        status: "متاحة",
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
  }
  return units;
}

async function main() {
  console.log("Wiping demo data tied to properties...");
  for (const name of WIPE_COLLECTIONS) {
    await wipeCollection(name);
  }

  const db = getAdminDb();
  const ownerId = "own-1"; // عبدالله السبيعي
  const today = new Date().toISOString().slice(0, 10);
  const DEFAULT_LAT = 24.7136;
  const DEFAULT_LNG = 46.6753;

  const limonUnits = makeUnits("__limon__", ownerId, [
    { count: 15, type: "غرفة عزاب", prefix: "", area: 25, price: 9000, bedrooms: 1, bathrooms: 1, startFloor: 1, perFloor: 5 },
  ]);
  const limonPrice = limonUnits.reduce((s, u) => s + u.price, 0);
  const limonArea = limonUnits.reduce((s, u) => s + u.area, 0);

  const limon: Omit<Property, "id"> = {
    title: "مجمع ليمون",
    type: "غرفة عزاب",
    city: "الرياض",
    district: "الملقا",
    address: "مجمع ليمون السكني",
    area: limonArea,
    bedrooms: 0,
    bathrooms: 0,
    price: limonPrice,
    listingType: "إيجار",
    status: "متاحة",
    ownerId,
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    color: "#3563f4",
    createdAt: today,
  };
  const limonRef = await db.collection("properties").add(limon);
  await Promise.all(
    limonUnits.map((u) => db.collection("units").add({ ...u, propertyId: limonRef.id }))
  );
  console.log(`  ✔ مجمع ليمون (${limonRef.id}) — ${limonUnits.length} units`);

  const mashrefUnits = makeUnits("__mashref__", ownerId, [
    { count: 4, type: "محل تجاري", prefix: "M", area: 50, price: 30000, bedrooms: 0, bathrooms: 1, startFloor: 0, perFloor: 4 },
    { count: 23, type: "غرفة عزاب", prefix: "", area: 25, price: 9000, bedrooms: 1, bathrooms: 1, startFloor: 1, perFloor: 6 },
  ]);
  const mashrefPrice = mashrefUnits.reduce((s, u) => s + u.price, 0);
  const mashrefArea = mashrefUnits.reduce((s, u) => s + u.area, 0);

  const mashref: Omit<Property, "id"> = {
    title: "مجمع المشارف",
    type: "محل تجاري",
    city: "الرياض",
    district: "المشارف",
    address: "مجمع المشارف",
    area: mashrefArea,
    bedrooms: 0,
    bathrooms: 0,
    price: mashrefPrice,
    listingType: "إيجار",
    status: "متاحة",
    ownerId,
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    color: "#1fa35c",
    createdAt: today,
  };
  const mashrefRef = await db.collection("properties").add(mashref);
  await Promise.all(
    mashrefUnits.map((u) => db.collection("units").add({ ...u, propertyId: mashrefRef.id }))
  );
  console.log(`  ✔ مجمع المشارف (${mashrefRef.id}) — ${mashrefUnits.length} units`);

  console.log("Done.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
