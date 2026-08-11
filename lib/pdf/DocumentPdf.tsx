import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts } from "./fonts";
import { pdfStyles as s } from "./styles";
import { pdfCurrency as currency } from "./format";
import { COMPANY_VAT_NUMBER } from "@/lib/mock-data";
import type { InvoiceItem } from "@/lib/types";

registerPdfFonts();

export interface DocumentPdfProps {
  docTitle: string;
  docNumber: string;
  statusBadge?: string;
  partyLabel: string;
  partyName: string;
  partySub: string;
  dateLabel1: string;
  dateValue1: string;
  dateLabel2: string;
  dateValue2: string;
  items: InvoiceItem[];
  taxRate: number;
  grandTotalLabel: string;
  notes?: string;
  footerNote: string;
}

export function DocumentPdf(props: DocumentPdfProps) {
  const subtotal = props.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = subtotal * props.taxRate;
  const total = subtotal + tax;

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
              {props.taxRate > 0 && <Text style={s.brandSub}>الرقم الضريبي: {COMPANY_VAT_NUMBER}</Text>}
            </View>
          </View>
          <View style={s.docTitleBlock}>
            <Text style={s.docTitle}>{props.docTitle}</Text>
            <Text style={s.docSub}>{props.docNumber}</Text>
            {props.statusBadge && <Text style={s.docSub}>{props.statusBadge}</Text>}
          </View>
        </View>

        <View style={s.partiesRow}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>{props.partyLabel}</Text>
            <Text style={s.partyValue}>{props.partyName}</Text>
            <Text style={s.partySub}>{props.partySub}</Text>
          </View>
          <View style={[s.partyBlock, { alignItems: "flex-end" }]}>
            <Text style={s.partyLabel}>{props.dateLabel1}</Text>
            <Text style={s.partyValue}>{props.dateValue1}</Text>
            <Text style={[s.partyLabel, { marginTop: 8 }]}>{props.dateLabel2}</Text>
            <Text style={s.partyValue}>{props.dateValue2}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tableHeadRow}>
            <Text style={[s.colDesc, s.headCellText]}>الوصف</Text>
            <Text style={[s.colQty, s.headCellText]}>الكمية</Text>
            <Text style={[s.colPrice, s.headCellText]}>سعر الوحدة</Text>
            <Text style={[s.colTotal, s.headCellText]}>الإجمالي</Text>
          </View>
          {props.items.map((item, idx) => (
            <View style={s.tableRow} key={idx}>
              <Text style={s.colDesc}>{item.description}</Text>
              <Text style={s.colQty}>{item.quantity}</Text>
              <Text style={s.colPrice}>{currency(item.unitPrice)}</Text>
              <Text style={s.colTotal}>{currency(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>المجموع الفرعي</Text>
              <Text style={s.totalValue}>{currency(subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                {props.taxRate > 0 ? `ضريبة القيمة المضافة (${Math.round(props.taxRate * 100)}%)` : "ضريبة القيمة المضافة"}
              </Text>
              <Text style={s.totalValue}>{props.taxRate > 0 ? currency(tax) : "معفى (عقار سكني)"}</Text>
            </View>
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>{props.grandTotalLabel}</Text>
              <Text style={s.grandValue}>{currency(total)}</Text>
            </View>
          </View>
        </View>

        {props.notes && (
          <View style={s.notesBlock}>
            <Text style={s.notesLabel}>ملاحظات</Text>
            <Text style={s.notesText}>{props.notes}</Text>
          </View>
        )}

        <Text style={s.footer}>{props.footerNote}</Text>
      </Page>
    </Document>
  );
}
