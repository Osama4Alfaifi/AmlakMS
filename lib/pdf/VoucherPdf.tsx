import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts } from "./fonts";
import { pdfStyles as s } from "./styles";
import { pdfCurrency as currency } from "./format";
import type { Voucher } from "@/lib/types";

registerPdfFonts();

const local = StyleSheet.create({
  row: { flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 22 },
  block: { width: "48%" },
  amountBlock: { marginBottom: 30 },
  amountValue: { fontSize: 16, fontWeight: "bold", color: "#1c3ab3", textAlign: "right" },
  statementBlock: { marginBottom: 50 },
  signRow: { flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 40 },
  signBlock: { width: "45%" },
  signLine: { borderBottomWidth: 1, borderBottomColor: "#374151", height: 30 },
  signLabel: { fontSize: 9, color: "#6b7280", textAlign: "center", marginTop: 6 },
});

export function VoucherPdf({ voucher }: { voucher: Voucher }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View style={s.brandRow}>
            <View style={s.logoBox}>
              <Text style={s.logoText}>MS</Text>
            </View>
            <View>
              <Text style={s.brandName}>أملاك MS</Text>
              <Text style={s.brandSub}>نظام إدارة الأملاك · الرياض، المملكة العربية السعودية</Text>
            </View>
          </View>
          <View style={s.docTitleBlock}>
            <Text style={s.docTitle}>سند {voucher.type}</Text>
            <Text style={s.docSub}>{voucher.number}</Text>
          </View>
        </View>

        <View style={local.row}>
          <View style={local.block}>
            <Text style={s.partyLabel}>{voucher.type === "قبض" ? "استلمنا من" : "صرفنا إلى"}</Text>
            <Text style={s.partyValue}>{voucher.personName}</Text>
          </View>
          <View style={[local.block, { alignItems: "flex-end" }]}>
            <Text style={s.partyLabel}>التاريخ</Text>
            <Text style={s.partyValue}>{voucher.date}</Text>
          </View>
        </View>

        <View style={local.row}>
          <View style={local.block}>
            <Text style={s.partyLabel}>المبلغ</Text>
            <Text style={local.amountValue}>{currency(voucher.amount)}</Text>
          </View>
          <View style={[local.block, { alignItems: "flex-end" }]}>
            <Text style={s.partyLabel}>طريقة {voucher.type === "قبض" ? "الاستلام" : "الصرف"}</Text>
            <Text style={s.partyValue}>{voucher.method}</Text>
          </View>
        </View>

        {(voucher.paymentNumber || (voucher.periodFrom && voucher.periodTo)) && (
          <View style={local.row}>
            {voucher.paymentNumber ? (
              <View style={local.block}>
                <Text style={s.partyLabel}>رقم الدفعة</Text>
                <Text style={s.partyValue}>{voucher.paymentNumber}</Text>
              </View>
            ) : (
              <View style={local.block} />
            )}
            {voucher.periodFrom && voucher.periodTo && (
              <View style={[local.block, { alignItems: "flex-end" }]}>
                <Text style={s.partyLabel}>الفترة</Text>
                <Text style={s.partyValue}>من {voucher.periodFrom} إلى {voucher.periodTo}</Text>
              </View>
            )}
          </View>
        )}

        <View style={local.statementBlock}>
          <Text style={s.partyLabel}>البيان</Text>
          <Text style={s.partyValue}>{voucher.statement || "—"}</Text>
        </View>

        <View style={local.signRow}>
          <View style={local.signBlock}>
            <View style={local.signLine} />
            <Text style={local.signLabel}>توقيع المستلم</Text>
          </View>
          <View style={local.signBlock}>
            <View style={local.signLine} />
            <Text style={local.signLabel}>توقيع المسلّم</Text>
          </View>
        </View>

        <Text style={[s.footer, { marginTop: 40 }]}>هذا سند تجريبي تم إنشاؤه بواسطة منصة أملاك MS — لأغراض العرض فقط</Text>
      </Page>
    </Document>
  );
}
