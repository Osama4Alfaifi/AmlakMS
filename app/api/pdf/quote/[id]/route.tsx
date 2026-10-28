import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { DocumentPdf } from "@/lib/pdf/DocumentPdf";
import type { Quote, UserProfile } from "@/lib/types";

// Mirrors firestore.rules: `match /quotes/{id} { allow read: if signedIn()
// && myRole() == "owner" && resource.data.ownerId == myProfile().linkedId; }`
// (admin covered by the wildcard) — only the owner the quote belongs to may
// read it, so this route re-checks that instead of just a valid token: Route
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

  const snap = await db.collection("quotes").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const quote = { id: snap.id, ...snap.data() } as Quote;

  // Quotes are a staff tool now (admin and leasing agents); an owner may still
  // read a quote that was issued to them (matches firestore.rules).
  const canView =
    profile.role === "admin" ||
    profile.role === "leasingAgent" ||
    (profile.role === "owner" && profile.linkedId === quote.ownerId);
  if (!canView) return NextResponse.json({ error: "forbidden" }, { status: 403 });

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
