import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { Contract, ContractPayment, Tenant, UserProfile } from "@/lib/types";

// Simulated tenant self-service "pay now" — no real payment gateway is
// wired up (see app/tenant's "بيئة دفع تجريبية" banner), so this just marks
// one payment "مسددة" the same way app/admin/contracts' handleSettlePayment
// does, but from an admin-SDK route rather than a direct Firestore write:
// verifying "this contract really belongs to this tenant, and only this
// one payment id changes" is awkward to express safely as a security-rules
// array diff, so the authorization check lives here in trusted server code
// instead. See firestore.rules' contracts match for the read-side scoping
// this mirrors.
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let uid: string;
  try {
    ({ uid } = await getAdminAuth().verifyIdToken(token));
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { contractId, paymentId } = (await req.json()) as { contractId?: string; paymentId?: string };
  if (!contractId || !paymentId) {
    return NextResponse.json({ error: "contractId and paymentId are required" }, { status: 400 });
  }

  const db = getAdminDb();
  const profileSnap = await db.collection("users").doc(uid).get();
  const profile = profileSnap.data() as UserProfile | undefined;
  if (!profile || profile.role !== "tenant" || !profile.linkedId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const tenantSnap = await db.collection("tenants").doc(profile.linkedId).get();
  const tenant = tenantSnap.data() as Tenant | undefined;
  if (!tenant) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const contractRef = db.collection("contracts").doc(contractId);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const contract = contractSnap.data() as Contract;

  // The real ownership check: this contract must actually be the tenant's own.
  if (contract.tenantId !== profile.linkedId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payments = contract.payments ?? [];
  const target = payments.find((p) => p.id === paymentId);
  if (!target) return NextResponse.json({ error: "payment not found" }, { status: 404 });

  // Idempotent no-op if already settled (guards a double-submit/retry).
  if (target.status === "مسددة") {
    return NextResponse.json({ reference: `DEMO-${paymentId}`, payment: target });
  }

  const reference = `DEMO-${Date.now().toString(36).toUpperCase()}`;
  const paidAt = new Date().toISOString().slice(0, 10);
  const updated: ContractPayment[] = payments.map((p) => (p.id === paymentId ? { ...p, status: "مسددة", paidAt } : p));

  await contractRef.update({ payments: updated });
  await db.collection("auditLogs").add({
    actorUid: uid,
    action: "update",
    entityType: "contracts",
    entityId: contractId,
    label: `دفعة ذاتية عبر البوابة (تجريبي) بقيمة ${target.amount.toLocaleString("ar-SA")} ﷼`,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ reference, payment: updated.find((p) => p.id === paymentId) });
}
