import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { EInvoicePdf } from "@/lib/pdf/EInvoicePdf";
import { buildZatcaQrPayload } from "@/lib/zatca/qr";
import { COMPANY_VAT_NUMBER, taxRateForPropertyType } from "@/lib/mock-data";
import type { Contract, Property, UserProfile, Voucher } from "@/lib/types";

// Trial ZATCA-style simplified tax invoice for a receipt voucher (سند قبض)
// tied to a rent payment. Same auth pattern as
// app/api/pdf/voucher/[id]/route.tsx — mirrors firestore.rules' vouchers
// scoping (admin/accountant only), since this derives from voucher data.
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

  const voucherSnap = await db.collection("vouchers").doc(id).get();
  if (!voucherSnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const voucher = { id: voucherSnap.id, ...voucherSnap.data() } as Voucher;

  if (voucher.type !== "قبض" || !voucher.contractId) {
    return NextResponse.json({ error: "e-invoice only applies to a receipt voucher tied to a rent payment" }, { status: 400 });
  }

  const contractSnap = await db.collection("contracts").doc(voucher.contractId).get();
  const contract = contractSnap.exists ? ({ id: contractSnap.id, ...contractSnap.data() } as Contract) : null;

  let vatRate = 0;
  if (contract) {
    const propertySnap = await db.collection("properties").doc(contract.propertyId).get();
    const property = propertySnap.exists ? (propertySnap.data() as Property) : null;
    if (property) vatRate = taxRateForPropertyType(property.type);
  }

  const subtotal = voucher.amount / (1 + vatRate);
  const vatTotal = voucher.amount - subtotal;
  const periodLabel =
    voucher.periodFrom && voucher.periodTo
      ? `${voucher.periodFrom} إلى ${voucher.periodTo}`
      : voucher.paymentNumber
      ? `دفعة رقم ${voucher.paymentNumber}`
      : voucher.statement || "—";

  const qrPayload = buildZatcaQrPayload({
    sellerName: "أملاك MS",
    vatNumber: COMPANY_VAT_NUMBER,
    timestamp: new Date(voucher.date).toISOString(),
    total: voucher.amount,
    vatTotal,
  });
  const qrDataUri = await QRCode.toDataURL(qrPayload, { margin: 1, width: 200 });

  const buffer = await renderToBuffer(
    <EInvoicePdf voucher={voucher} periodLabel={periodLabel} subtotal={subtotal} vatRate={vatRate} vatTotal={vatTotal} qrDataUri={qrDataUri} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="einvoice-${voucher.number}.pdf"`,
    },
  });
}
