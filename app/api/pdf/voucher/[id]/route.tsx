import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { VoucherPdf } from "@/lib/pdf/VoucherPdf";
import type { UserProfile, Voucher } from "@/lib/types";

// Mirrors firestore.rules: `match /vouchers/{id} { allow read, ...: if isAccountant(); }`
// (admin covered by the wildcard) — vouchers aren't public-read like
// quotes/invoices, so this route checks the caller's role, not just that
// they're signed in.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (!profile || (profile.role !== "admin" && profile.role !== "accountant")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const snap = await db.collection("vouchers").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const voucher = { id: snap.id, ...snap.data() } as Voucher;

  const buffer = await renderToBuffer(<VoucherPdf voucher={voucher} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${voucher.number}.pdf"`,
    },
  });
}
