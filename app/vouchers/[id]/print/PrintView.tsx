"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Building2, Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { currency } from "@/lib/mock-data";
import { useFirestoreDoc } from "@/lib/firestore/hooks";
import { downloadPdf } from "@/lib/pdf/download";
import type { Voucher } from "@/lib/types";

export default function VoucherPrintPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const voucher = useFirestoreDoc<Voucher>("vouchers", params.id);
  const [downloading, setDownloading] = useState(false);
  const [downloadingEinvoice, setDownloadingEinvoice] = useState(false);

  if (voucher === undefined) return null;

  if (voucher === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted">
        <p>لم يتم العثور على السند</p>
        <Button variant="outline" onClick={() => router.push("/admin/vouchers")}>
          العودة للسندات
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="no-print max-w-3xl mx-auto px-5 mb-4 flex items-center justify-between">
        <button onClick={() => router.push("/admin/vouchers")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowRight size={16} /> رجوع
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={downloading} onClick={async () => {
            setDownloading(true);
            try {
              await downloadPdf(`/api/pdf/voucher/${voucher.id}`, voucher.number);
            } catch {
              alert("تعذّر تحميل PDF");
            } finally {
              setDownloading(false);
            }
          }}>
            <Download size={16} /> {downloading ? "جارِ التحميل..." : "تحميل PDF"}
          </Button>
          {voucher.type === "قبض" && voucher.contractId && (
            <Button variant="outline" disabled={downloadingEinvoice} onClick={async () => {
              setDownloadingEinvoice(true);
              try {
                await downloadPdf(`/api/pdf/einvoice/${voucher.id}`, `einvoice-${voucher.number}`);
              } catch {
                alert("تعذّر تحميل الفاتورة الإلكترونية");
              } finally {
                setDownloadingEinvoice(false);
              }
            }}>
              <FileText size={16} /> {downloadingEinvoice ? "جارِ التحميل..." : "تحميل فاتورة إلكترونية (تجريبي)"}
            </Button>
          )}
          <Button onClick={() => window.print()}>
            <Printer size={16} /> طباعة / تصدير PDF
          </Button>
        </div>
      </div>

      <div className="print-sheet max-w-2xl mx-auto bg-surface border border-border rounded-2xl shadow-sm shadow-black/[0.03] p-8 lg:p-10">
        <div className="flex items-start justify-between border-b border-border pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Building2 size={22} />
            </div>
            <div>
              <p className="font-extrabold text-lg">أملاك MS</p>
              <p className="text-xs text-muted">نظام إدارة الأملاك · الرياض، المملكة العربية السعودية</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xl font-extrabold text-brand-700">سند {voucher.type}</p>
            <p className="text-xs text-muted mt-1">{voucher.number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-muted mb-1">{voucher.type === "قبض" ? "استلمنا من" : "صرفنا إلى"}</p>
            <p className="font-bold">{voucher.personName}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted mb-1">التاريخ</p>
            <p className="font-semibold">{voucher.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-xs text-muted mb-1">المبلغ</p>
            <p className="text-lg font-extrabold text-brand-700">{currency(voucher.amount)}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted mb-1">طريقة {voucher.type === "قبض" ? "الاستلام" : "الصرف"}</p>
            <p className="font-semibold">{voucher.method}</p>
          </div>
        </div>

        {(voucher.paymentNumber || (voucher.periodFrom && voucher.periodTo)) && (
          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            {voucher.paymentNumber && (
              <div>
                <p className="text-xs text-muted mb-1">رقم الدفعة</p>
                <p className="font-semibold">{voucher.paymentNumber}</p>
              </div>
            )}
            {voucher.periodFrom && voucher.periodTo && (
              <div className="text-left">
                <p className="text-xs text-muted mb-1">الفترة</p>
                <p className="font-semibold">من {voucher.periodFrom} إلى {voucher.periodTo}</p>
              </div>
            )}
          </div>
        )}

        <div className="mb-10 text-sm">
          <p className="text-xs text-muted mb-1">البيان</p>
          <p className="font-medium">{voucher.statement || "—"}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 mt-16 text-sm">
          <div>
            <div className="border-b border-foreground/40 h-10" />
            <p className="text-xs text-muted mt-2 text-center">توقيع المستلم</p>
          </div>
          <div>
            <div className="border-b border-foreground/40 h-10" />
            <p className="text-xs text-muted mt-2 text-center">توقيع المسلّم</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted text-center">
          هذا سند تجريبي تم إنشاؤه بواسطة منصة أملاك MS — لأغراض العرض فقط
        </div>
      </div>
    </div>
  );
}
