"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Building2, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { COMPANY_VAT_NUMBER, currency } from "@/lib/mock-data";
import { useFirestoreDoc } from "@/lib/firestore/hooks";
import type { Invoice } from "@/lib/types";

export default function InvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoice = useFirestoreDoc<Invoice>("invoices", params.id);

  if (invoice === undefined) return null;

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted">
        <p>لم يتم العثور على الفاتورة</p>
        <Button variant="outline" onClick={() => router.push("/reports")}>
          العودة للتقارير
        </Button>
      </div>
    );
  }

  const subtotal = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxRate = invoice.taxRate ?? 0.15;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="no-print max-w-3xl mx-auto px-5 mb-4 flex items-center justify-between">
        <button onClick={() => router.push("/reports")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowRight size={16} /> رجوع
        </button>
        <Button onClick={() => window.print()}>
          <Printer size={16} /> طباعة / تصدير PDF
        </Button>
      </div>

      <div className="print-sheet max-w-3xl mx-auto bg-surface border border-border rounded-2xl shadow-sm shadow-black/[0.03] p-8 lg:p-10">
        <div className="flex items-start justify-between border-b border-border pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Building2 size={22} />
            </div>
            <div>
              <p className="font-extrabold text-lg">أملاك MS</p>
              <p className="text-xs text-muted">نظام إدارة الأملاك · الرياض، المملكة العربية السعودية</p>
              {taxRate > 0 && <p className="text-xs text-muted mt-0.5">الرقم الضريبي: {COMPANY_VAT_NUMBER}</p>}
            </div>
          </div>
          <div className="text-left">
            <p className="text-xl font-extrabold text-brand-700">فاتورة</p>
            <p className="text-xs text-muted mt-1">{invoice.number}</p>
            <div className="mt-2"><Badge>{invoice.status}</Badge></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-muted mb-1">فاتورة إلى</p>
            <p className="font-bold">{invoice.clientName}</p>
            <p className="text-muted mt-1">{invoice.propertyTitle}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted mb-1">تاريخ الإصدار</p>
            <p className="font-semibold">{invoice.issueDate}</p>
            <p className="text-xs text-muted mt-2 mb-1">تاريخ الاستحقاق</p>
            <p className="font-semibold">{invoice.dueDate}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="text-right font-semibold py-2">الوصف</th>
              <th className="text-center font-semibold py-2">الكمية</th>
              <th className="text-left font-semibold py-2">سعر الوحدة</th>
              <th className="text-left font-semibold py-2">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-center">{item.quantity}</td>
                <td className="py-2.5 text-left">{currency(item.unitPrice)}</td>
                <td className="py-2.5 text-left font-semibold">{currency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-full max-w-xs flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>المجموع الفرعي</span>
              <span>{currency(subtotal)}</span>
            </div>
            {taxRate > 0 ? (
              <div className="flex justify-between text-muted">
                <span>ضريبة القيمة المضافة ({Math.round(taxRate * 100)}%)</span>
                <span>{currency(tax)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-muted">
                <span>ضريبة القيمة المضافة</span>
                <span>معفى (عقار سكني)</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-base border-t border-border pt-2">
              <span>الإجمالي المستحق</span>
              <span className="text-brand-700">{currency(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted text-center">
          هذه فاتورة تجريبية تم إنشاؤها بواسطة منصة أملاك MS — لأغراض العرض فقط
        </div>
      </div>
    </div>
  );
}
