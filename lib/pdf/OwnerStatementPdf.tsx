import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { registerPdfFonts } from "./fonts";
import { pdfStyles as s } from "./styles";
import { pdfCurrency as currency } from "./format";
import type { Contract, Property } from "@/lib/types";

registerPdfFonts();

const local = StyleSheet.create({
  contractRow: { flexDirection: "row-reverse", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingVertical: 6 },
  colProperty: { width: "50%", textAlign: "right" },
  colCity: { width: "25%", textAlign: "right", color: "#6b7280" },
  colValue: { width: "25%", textAlign: "left", fontWeight: "bold" },
});

export interface OwnerStatementPdfProps {
  ownerName: string;
  propertiesCount: number;
  contracts: (Contract & { property?: Property })[];
  annualIncome: number;
  totalExpenses: number;
  expensesCount: number;
  feeRatePct: number;
  managementFee: number;
  netIncome: number;
  issuedAt: string;
}

export function OwnerStatementPdf(props: OwnerStatementPdfProps) {
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
            <Text style={s.docTitle}>كشف حساب مالك</Text>
            <Text style={s.docSub}>{props.issuedAt}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={s.partyLabel}>المالك</Text>
          <Text style={s.partyValue}>{props.ownerName}</Text>
          <Text style={s.partySub}>{props.propertiesCount} عقار مملوك — {props.contracts.length} عقد نشط</Text>
        </View>

        <View style={s.table}>
          <View style={s.tableHeadRow}>
            <Text style={[local.colProperty, s.headCellText]}>العقار</Text>
            <Text style={[local.colCity, s.headCellText]}>المدينة</Text>
            <Text style={[local.colValue, s.headCellText]}>قيمة العقد السنوي</Text>
          </View>
          {props.contracts.map((c) => (
            <View style={local.contractRow} key={c.id}>
              <Text style={local.colProperty}>{c.property?.title ?? "—"}</Text>
              <Text style={local.colCity}>{c.property?.city ?? "—"}</Text>
              <Text style={local.colValue}>{currency(c.value)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>الدخل الإجمالي</Text>
              <Text style={s.totalValue}>{currency(props.annualIncome)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>المصروفات ({props.expensesCount})</Text>
              <Text style={s.totalValue}>-{currency(props.totalExpenses)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>عمولة الإدارة ({props.feeRatePct}%)</Text>
              <Text style={s.totalValue}>-{currency(props.managementFee)}</Text>
            </View>
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>صافي الدخل المستحق</Text>
              <Text style={s.grandValue}>{currency(props.netIncome)}</Text>
            </View>
          </View>
        </View>

        <Text style={s.footer}>هذا كشف حساب تجريبي تم إنشاؤه بواسطة منصة أملاك MS — لأغراض العرض فقط</Text>
      </Page>
    </Document>
  );
}
