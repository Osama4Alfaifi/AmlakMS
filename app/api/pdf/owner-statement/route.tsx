import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { OwnerStatementPdf } from "@/lib/pdf/OwnerStatementPdf";
import { DEFAULT_MANAGEMENT_FEE_RATE } from "@/lib/mock-data";
import type { Contract, Expense, Owner, Property, UserProfile } from "@/lib/types";

// Owner statements are the one PDF that ISN'T open to any signed-in
// account: an owner may only pull their own statement; admin/accountant
// may pull any owner's — same scoping firestore.rules applies to
// expenses/owner data, re-implemented here since Route Handlers don't run
// through Firestore security rules (only the Admin SDK, which bypasses
// them) — this check is what actually enforces it for this endpoint.
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let uid: string;
  try {
    ({ uid } = await getAdminAuth().verifyIdToken(token));
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const profileSnap = await db.collection("users").doc(uid).get();
  if (!profileSnap.exists) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const profile = profileSnap.data() as UserProfile;

  const requestedOwnerId = req.nextUrl.searchParams.get("ownerId");
  const canViewAny = profile.role === "admin" || profile.role === "accountant";
  const ownerId = requestedOwnerId ?? (profile.role === "owner" ? profile.linkedId : null);

  if (!ownerId) return NextResponse.json({ error: "ownerId required" }, { status: 400 });
  if (!canViewAny && !(profile.role === "owner" && profile.linkedId === ownerId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ownerSnap = await db.collection("owners").doc(ownerId).get();
  if (!ownerSnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const owner = { id: ownerSnap.id, ...ownerSnap.data() } as Owner;

  const [propertiesSnap, contractsSnap, expensesSnap] = await Promise.all([
    db.collection("properties").where("ownerId", "==", ownerId).get(),
    db.collection("contracts").where("ownerId", "==", ownerId).where("status", "==", "نشط").get(),
    db.collection("expenses").where("ownerId", "==", ownerId).get(),
  ]);
  const properties = propertiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Property);
  const contracts = contractsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Contract);
  const expenses = expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense);

  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const annualIncome = contracts.reduce((sum, c) => sum + c.value, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const feeRate = owner.managementFeeRate ?? DEFAULT_MANAGEMENT_FEE_RATE;
  const managementFee = Math.max(0, annualIncome - totalExpenses) * feeRate;
  const netIncome = annualIncome - totalExpenses - managementFee;

  const buffer = await renderToBuffer(
    <OwnerStatementPdf
      ownerName={owner.name}
      propertiesCount={properties.length}
      contracts={contracts.map((c) => ({ ...c, property: propertyById.get(c.propertyId) }))}
      annualIncome={annualIncome}
      totalExpenses={totalExpenses}
      expensesCount={expenses.length}
      feeRatePct={Math.round(feeRate * 100)}
      managementFee={managementFee}
      netIncome={netIncome}
      issuedAt={new Date().toISOString().slice(0, 10)}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="owner-statement-${ownerId}.pdf"`,
    },
  });
}
