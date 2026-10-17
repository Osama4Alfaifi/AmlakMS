import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { Owner, UserProfile } from "@/lib/types";

// Provisions a login for an owner who doesn't have one yet — most often a
// brand-new owner a leasing agent just created inline in the intake wizard
// (app/admin/properties/new), who only ever gets an owners/{id} document
// there, never a Firebase Auth account. Also reachable from app/admin/users
// as a manual fix for any owner missing one (seed data gaps, a missing
// phone at creation time, etc).
//
// Deliberately simple for this app's current dev phase (same posture as the
// shared demo password on the login page — see app/login/LoginForm.tsx):
// synthetic email + password both derived from the phone number, same
// convention already used for technicians' synthetic ${id}@amlakms.sa
// login (see scripts/seed.ts) rather than inventing a new one. Revisit
// before a real launch, same as the login page's demo password.
export async function POST(req: NextRequest) {
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
  const profile = profileSnap.data() as UserProfile | undefined;
  if (!profile || (profile.role !== "admin" && profile.role !== "leasingAgent")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { ownerId } = (await req.json()) as { ownerId?: string };
  if (!ownerId) return NextResponse.json({ error: "ownerId is required" }, { status: 400 });

  const ownerSnap = await db.collection("owners").doc(ownerId).get();
  if (!ownerSnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const owner = ownerSnap.data() as Owner;

  const digits = (owner.phone || "").replace(/\D/g, "");
  if (!digits) {
    return NextResponse.json({ error: "لا يوجد رقم جوال مسجّل لهذا المالك — أضِف رقم الجوال أولًا" }, { status: 400 });
  }

  // Single-field query (no composite index needed) — an owner has at most
  // one or two linked profiles in practice, cheap to filter in memory.
  const existing = await db.collection("users").where("linkedId", "==", ownerId).get();
  if (existing.docs.some((d) => d.data().role === "owner")) {
    return NextResponse.json({ error: "يوجد حساب دخول مسبق لهذا المالك" }, { status: 409 });
  }

  const email = `${digits}@amlakms.sa`;
  const password = digits.length >= 6 ? digits : digits.padEnd(6, "0");

  let authUid: string;
  try {
    const created = await getAdminAuth().createUser({ email, password, displayName: owner.name });
    authUid = created.uid;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      return NextResponse.json({ error: "رقم الجوال هذا مستخدم بالفعل في حساب آخر" }, { status: 409 });
    }
    throw err;
  }

  await db.collection("users").doc(authUid).set({
    role: "owner",
    name: owner.name,
    email,
    linkedId: ownerId,
  });

  await db.collection("auditLogs").add({
    actorUid: uid,
    action: "create",
    entityType: "users",
    entityId: authUid,
    label: `تم إنشاء حساب دخول للمالك ${owner.name}`,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ email, password });
}
