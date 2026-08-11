import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { DocumentPdf } from "@/lib/pdf/DocumentPdf";
import type { Quote } from "@/lib/types";

// Mirrors firestore.rules: `match /quotes/{id} { allow read: if signedIn(); }`
// — any authenticated account can read a quote, so this route only needs a
// valid Firebase ID token, not a role check.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    await getAdminAuth().verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const snap = await getAdminDb().collection("quotes").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const quote = { id: snap.id, ...snap.data() } as Quote;

  const buffer = await renderToBuffer(
    <DocumentPdf
      docTitle="عرض سعر"
      docNumber={quote.number}
      partyLabel="مقدم إلى"
      partyName={quote.clientName}
      partySub={quote.propertyTitle}
      dateLabel1="تاريخ الإصدار"
      dateValue1={quote.createdAt}
      dateLabel2="صالح حتى"
      dateValue2={quote.validUntil}
      items={quote.items}
      taxRate={quote.taxRate}
      grandTotalLabel="الإجمالي"
      notes={quote.notes}
      footerNote="هذا عرض سعر تجريبي تم إنشاؤه بواسطة منصة أملاك MS — لأغراض العرض فقط"
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
    },
  });
}
