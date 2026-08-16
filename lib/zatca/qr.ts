// Builds the payload for a ZATCA (Saudi Zakat, Tax and Customs Authority)
// "simplified tax invoice" QR code — the 5-field TLV+Base64 structure
// (seller name, VAT number, timestamp, invoice total, VAT total) that's
// part of the publicly documented e-invoicing spec and doesn't itself
// require a certified ZATCA credential to construct.
//
// This is NOT full ZATCA Phase-2 compliance: a real compliant invoice also
// carries a cryptographic stamp signed with a CSID (Cryptographic Stamp
// Identifier) issued by ZATCA to a registered establishment, plus real-time
// reporting to the Fatoora portal — neither of which this trial/demo
// invoice does. See lib/pdf/EInvoicePdf.tsx for the on-document disclaimer.
export interface ZatcaQrFields {
  sellerName: string;
  vatNumber: string;
  // ISO 8601 timestamp, e.g. "2026-08-15T10:30:00".
  timestamp: string;
  // Invoice total INCLUDING VAT.
  total: number;
  vatTotal: number;
}

function tlvField(tag: number, value: string): Buffer {
  const valueBuf = Buffer.from(value, "utf-8");
  return Buffer.concat([Buffer.from([tag, valueBuf.length]), valueBuf]);
}

export function buildZatcaQrPayload(fields: ZatcaQrFields): string {
  const buf = Buffer.concat([
    tlvField(1, fields.sellerName),
    tlvField(2, fields.vatNumber),
    tlvField(3, fields.timestamp),
    tlvField(4, fields.total.toFixed(2)),
    tlvField(5, fields.vatTotal.toFixed(2)),
  ]);
  return buf.toString("base64");
}
