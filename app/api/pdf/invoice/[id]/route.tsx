import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { DocumentPdf } from "@/lib/pdf/DocumentPdf";
import type { Invoice, UserProfile } from "@/lib/types";

// Mirrors firestore.rules: `match /invoices/{id} { allow read: if signedIn()
// && (isMyOwner(resource.data.ownerId) || (owner's own) || (tenant's own)); }`
// (admin covered by the wildcard) — scoped to the accountant's assigned
// owners, the owner it belongs to, or the tenant it's billed to. Route
// Handlers run on the Admin SDK, which bypasses Firestore security rules
// entirely, so this check is what actually enforces it for this endpoint.
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
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const snap = await db.collection("invoices").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const invoice = { id: snap.id, ...snap.data() } as Invoice;

  const canView =
    profile.role === "admin" ||
    (profile.role === "accountant" && !!invoice.ownerId && !!profile.ownerIds?.includes(invoice.ownerId)) ||
    (profile.role === "owner" && profile.linkedId === invoice.ownerId) ||
    (profile.role === "tenant" && profile.linkedId === invoice.tenantId);
  if (!canView) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const taxRate = invoice.taxRate ?? 0.15;

  const buffer = await renderToBuffer(
    <DocumentPdf
      docTitle="فاتورة"
      docNumber={invoice.number}
      statusBadge={invoice.status}
      partyLabel="فاتورة إلى"
      partyName={invoice.clientName}
      partySub={invoice.propertyTitle}
      dateLabel1="تاريخ الإصدار"
      dateValue1={invoice.issueDate}
      dateLabel2="تاريخ الاستحقاق"
      dateValue2={invoice.dueDate}
      items={invoice.items}
      taxRate={taxRate}
      grandTotalLabel="الإجمالي المستحق"
      footerNote="هذه فاتورة تجريبية تم إنشاؤها بواسطة منصة أملاك MS — لأغراض العرض فقط"
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
