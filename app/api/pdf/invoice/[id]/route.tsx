import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { DocumentPdf } from "@/lib/pdf/DocumentPdf";
import type { Invoice } from "@/lib/types";

// Mirrors firestore.rules: `match /invoices/{id} { allow read: if signedIn(); }`
// — any authenticated account can read an invoice, so this route only needs
// a valid Firebase ID token, not a role check.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const snap = await getAdminDb().collection("invoices").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const invoice = { id: snap.id, ...snap.data() } as Invoice;
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
