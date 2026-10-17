"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, ArrowRight, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { COMPANY_VAT_NUMBER, currency } from "@/lib/mock-data";
import { useFirestoreDoc } from "@/lib/firestore/hooks";
import { downloadPdf } from "@/lib/pdf/download";
import type { Quote } from "@/lib/types";

export default function QuotePrintPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quote = useFirestoreDoc<Quote>("quotes", params.id);
  const [downloading, setDownloading] = useState(false);

  if (quote === undefined) return null;

  if (quote === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted">
        <p>لم يتم العثور على عرض السعر</p>
        <Button variant="outline" onClick={() => router.push("/quotes")}>
          العودة لعروض الأسعار
        </Button>
      </div>
    );
  }

  const subtotal = quote.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * quote.taxRate;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-background py-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="no-print max-w-3xl mx-auto px-5 mb-4 flex items-center justify-between">
        <button onClick={() => router.push("/quotes")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowRight size={16} /> رجوع
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={downloading} onClick={async () => {
            setDownloading(true);
            try {
              await downloadPdf(`/api/pdf/quote/${quote.id}`, quote.number);
            } catch {
              alert("تعذّر تحميل PDF");
            } finally {
              setDownloading(false);
            }
          }}>
            <Download size={16} /> {downloading ? "جارِ التحميل..." : "تحميل PDF"}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer size={16} /> طباعة / تصدير PDF
          </Button>
        </div>
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
              {quote.taxRate > 0 && <p className="text-xs text-muted mt-0.5">الرقم الضريبي: {COMPANY_VAT_NUMBER}</p>}
            </div>
          </div>
          <div className="text-end">
            <p className="text-xl font-extrabold text-brand-700">عرض سعر</p>
            <p className="text-xs text-muted mt-1">{quote.number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-muted mb-1">مقدم إلى</p>
            <p className="font-bold">{quote.clientName}</p>
            <p className="text-muted mt-1">{quote.propertyTitle}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted mb-1">تاريخ الإصدار</p>
            <p className="font-semibold">{quote.createdAt}</p>
            <p className="text-xs text-muted mt-2 mb-1">صالح حتى</p>
            <p className="font-semibold">{quote.validUntil}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="text-start font-semibold py-2">الوصف</th>
              <th className="text-center font-semibold py-2">الكمية</th>
              <th className="text-end font-semibold py-2">سعر الوحدة</th>
              <th className="text-end font-semibold py-2">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-center">{item.quantity}</td>
                <td className="py-2.5 text-end">{currency(item.unitPrice)}</td>
                <td className="py-2.5 text-end font-semibold">{currency(item.quantity * item.unitPrice)}</td>
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
            {quote.taxRate > 0 ? (
              <div className="flex justify-between text-muted">
                <span>ضريبة القيمة المضافة ({Math.round(quote.taxRate * 100)}%)</span>
                <span>{currency(tax)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-muted">
                <span>ضريبة القيمة المضافة</span>
                <span>معفى (عقار سكني)</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-base border-t border-border pt-2">
              <span>الإجمالي</span>
              <span className="text-brand-700">{currency(total)}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-8 border-t border-border pt-4 text-sm">
            <p className="text-xs text-muted mb-1">ملاحظات</p>
            <p>{quote.notes}</p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted text-center">
          هذا عرض سعر تجريبي تم إنشاؤه بواسطة منصة أملاك MS — لأغراض العرض فقط
        </div>
      </div>
    </div>
  );
}
