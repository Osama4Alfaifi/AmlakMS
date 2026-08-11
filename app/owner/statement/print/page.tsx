"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { currency, DEFAULT_MANAGEMENT_FEE_RATE } from "@/lib/mock-data";
import {
  useContracts,
  useFirestoreDoc,
  useOwnerExpenses,
  useProperties,
} from "@/lib/firestore/hooks";
import type { Owner } from "@/lib/types";

export default function OwnerStatementPrintPage() {
  const router = useRouter();
  const { user } = useAuth();
  const currentOwner = useFirestoreDoc<Owner>("owners", user?.linkedId ?? undefined);
  const { data: properties } = useProperties();
  const { data: contracts } = useContracts();
  const { data: expenses } = useOwnerExpenses(user?.linkedId);

  if (!currentOwner) return null;

  const myProperties = properties.filter((p) => p.ownerId === currentOwner.id);
  const myContracts = contracts.filter((c) => c.ownerId === currentOwner.id && c.status === "نشط");
  const annualIncome = myContracts.reduce((sum, c) => sum + c.value, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const feeRate = currentOwner.managementFeeRate ?? DEFAULT_MANAGEMENT_FEE_RATE;
  const managementFee = Math.max(0, annualIncome - totalExpenses) * feeRate;
  const netIncome = annualIncome - totalExpenses - managementFee;

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="no-print max-w-3xl mx-auto px-5 mb-4 flex items-center justify-between">
        <button onClick={() => router.push("/owner")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
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
            </div>
          </div>
          <div className="text-left">
            <p className="text-xl font-extrabold text-brand-700">كشف حساب مالك</p>
            <p className="text-xs text-muted mt-1">{new Date().toISOString().slice(0, 10)}</p>
          </div>
        </div>

        <div className="mb-8 text-sm">
          <p className="text-xs text-muted mb-1">المالك</p>
          <p className="font-bold">{currentOwner.name}</p>
          <p className="text-muted mt-1">{myProperties.length} عقار مملوك — {myContracts.length} عقد نشط</p>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="text-right font-semibold py-2">العقار</th>
              <th className="text-right font-semibold py-2">المدينة</th>
              <th className="text-left font-semibold py-2">قيمة العقد السنوي</th>
            </tr>
          </thead>
          <tbody>
            {myContracts.map((c) => {
              const property = properties.find((p) => p.id === c.propertyId);
              return (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="py-2.5">{property?.title ?? "—"}</td>
                  <td className="py-2.5 text-muted">{property?.city ?? "—"}</td>
                  <td className="py-2.5 text-left font-semibold">{currency(c.value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-full max-w-xs flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>الدخل الإجمالي</span>
              <span>{currency(annualIncome)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>المصروفات ({expenses.length})</span>
              <span>-{currency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>عمولة الإدارة ({Math.round(feeRate * 100)}%)</span>
              <span>-{currency(managementFee)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-base border-t border-border pt-2">
              <span>صافي الدخل المستحق</span>
              <span className="text-brand-700">{currency(netIncome)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted text-center">
          هذا كشف حساب تجريبي تم إنشاؤه بواسطة منصة أملاك MS — لأغراض العرض فقط
        </div>
      </div>
    </div>
  );
}
