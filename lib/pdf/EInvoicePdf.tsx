import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts } from "./fonts";
import { pdfStyles as s } from "./styles";
import { pdfCurrency as currency } from "./format";
import { COMPANY_VAT_NUMBER } from "@/lib/mock-data";
import type { Voucher } from "@/lib/types";

registerPdfFonts();

const local = StyleSheet.create({
  trialBanner: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 6,
    padding: 8,
    marginBottom: 16,
  },
  trialBannerText: { fontSize: 9, color: "#92400e", textAlign: "center", fontWeight: "bold" },
  row: { flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 22 },
  block: { width: "48%" },
  qrRow: { flexDirection: "row-reverse", alignItems: "flex-start", justifyContent: "space-between", marginTop: 10, marginBottom: 20 },
  qrImage: { width: 90, height: 90 },
  qrLabel: { fontSize: 7, color: "#9ca3af", textAlign: "center", marginTop: 4, width: 90 },
});

export interface EInvoicePdfProps {
  voucher: Voucher;
  periodLabel: string;
  subtotal: number;
  vatRate: number;
  vatTotal: number;
  qrDataUri: string;
}

export function EInvoicePdf({ voucher, periodLabel, subtotal, vatRate, vatTotal, qrDataUri }: EInvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={local.trialBanner}>
          <Text style={local.trialBannerText}>
            نسخة تجريبية — غير معتمدة من هيئة الزكاة والضريبة والجمارك (ZATCA)، بدون ختم تشفير رسمي
          </Text>
        </View>

        <View style={s.headerRow}>
          <View style={s.brandRow}>
            <View style={s.logoBox}>
              <Text style={s.logoText}>MS</Text>
            </View>
            <View>
              <Text style={s.brandName}>أملاك MS</Text>
              <Text style={s.brandSub}>نظام إدارة الأملاك · الرياض، المملكة العربية السعودية</Text>
              <Text style={s.brandSub}>الرقم الضريبي: {COMPANY_VAT_NUMBER}</Text>
            </View>
          </View>
          <View style={s.docTitleBlock}>
            <Text style={s.docTitle}>فاتورة ضريبية مبسطة</Text>
            <Text style={s.docSub}>{voucher.number}</Text>
          </View>
        </View>

        <View style={local.row}>
          <View style={local.block}>
            <Text style={s.partyLabel}>العميل</Text>
            <Text style={s.partyValue}>{voucher.personName}</Text>
          </View>
          <View style={[local.block, { alignItems: "flex-end" }]}>
            <Text style={s.partyLabel}>تاريخ الإصدار</Text>
            <Text style={s.partyValue}>{voucher.date}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tableHeadRow}>
            <Text style={[s.colDesc, s.headCellText]}>الوصف</Text>
            <Text style={[s.colQty, s.headCellText]}>الكمية</Text>
            <Text style={[s.colPrice, s.headCellText]}>السعر</Text>
            <Text style={[s.colTotal, s.headCellText]}>الإجمالي</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={s.colDesc}>دفعة إيجار — {periodLabel}</Text>
            <Text style={s.colQty}>1</Text>
            <Text style={s.colPrice}>{currency(subtotal)}</Text>
            <Text style={s.colTotal}>{currency(subtotal)}</Text>
          </View>
        </View>

        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>المجموع الفرعي</Text>
              <Text style={s.totalValue}>{currency(subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                {vatRate > 0 ? `ضريبة القيمة المضافة (${Math.round(vatRate * 100)}%)` : "ضريبة القيمة المضافة"}
              </Text>
              <Text style={s.totalValue}>{vatRate > 0 ? currency(vatTotal) : "معفى (عقار سكني)"}</Text>
            </View>
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>الإجمالي شامل الضريبة</Text>
              <Text style={s.grandValue}>{currency(voucher.amount)}</Text>
            </View>
          </View>
        </View>

        <View style={local.qrRow}>
          <View>
            <Image src={qrDataUri} style={local.qrImage} />
            <Text style={local.qrLabel}>رمز الاستجابة السريعة (تجريبي)</Text>
          </View>
        </View>

        <Text style={s.footer}>
          هذه فاتورة تجريبية تم إنشاؤها بواسطة منصة أملاك MS لأغراض العرض فقط — غير صالحة كفاتورة ضريبية معتمدة
        </Text>
      </Page>
    </Document>
  );
}
