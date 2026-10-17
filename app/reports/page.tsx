"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { PieChartCard, RevenueAreaChart } from "@/components/charts/Charts";
import { useAuth } from "@/lib/auth-context";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { currency, monthlyRevenue } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { downloadExcel } from "@/lib/excel";
import { useOwnerInvoices, useTenantInvoices } from "@/lib/firestore/hooks";
import { Download, Eye, FileSpreadsheet, FileWarning, ReceiptText, Search, Wallet } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const scope = useAccountantOwnerScope();
  const [status, setStatus] = useState("الكل");
  const [query, setQuery] = useState("");
  // Both scoped queries are called unconditionally (rules of hooks) — only
  // the one matching the signed-in role's field constraint actually fetches
  // (see fieldConstraint in lib/firestore/hooks.ts: undefined = don't fetch
  // yet, null = unconstrained). admin gets ownerId=null → unconstrained,
  // which its wildcard rule allows regardless of query shape.
  const ownerScopedId =
    user?.role === "owner" ? user.linkedId ?? undefined : scope.isAccountant ? scope.queryOwnerId : user?.role === "admin" ? null : undefined;
  const { data: ownerInvoices } = useOwnerInvoices(ownerScopedId);
  const { data: tenantInvoices } = useTenantInvoices(user?.role === "tenant" ? user.linkedId ?? undefined : undefined);
  const scopedInvoices = user?.role === "tenant" ? tenantInvoices : ownerInvoices;

  const filtered = useMemo(
    () =>
      scopedInvoices.filter(
        (i) =>
          (status === "الكل" || i.status === status) &&
          (i.number.includes(query) || i.clientName.includes(query) || i.propertyTitle.includes(query))
      ),
    [scopedInvoices, status, query]
  );

  const exportRows = () =>
    filtered.map((inv) => ({
      الرقم: inv.number,
      العميل: inv.clientName,
      العقار: inv.propertyTitle,
      المبلغ: inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      "تاريخ الاستحقاق": inv.dueDate,
      الحالة: inv.status,
    }));

  const totalCollected = scopedInvoices.filter((i) => i.status === "مدفوعة").reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);
  const totalPending = scopedInvoices.filter((i) => i.status !== "مدفوعة").reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);
  const overdue = scopedInvoices.filter((i) => i.status === "متأخرة").length;

  const statusDistribution = ["مدفوعة", "معلقة", "متأخرة"].map((s) => ({
    name: s,
    value: scopedInvoices.filter((i) => i.status === s).length,
  })).filter((d) => d.value > 0);

  const showBI = user?.role === "admin" || user?.role === "owner" || user?.role === "accountant";

  return (
    <DashboardShell allow={["admin", "owner", "tenant", "accountant"]} title="التقارير والفواتير">
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="إجمالي المحصّل" value={currency(totalCollected)} icon={Wallet} tone="success" />
          <StatCard label="مستحقات معلقة" value={currency(totalPending)} icon={ReceiptText} tone="warning" />
          <StatCard label="فواتير متأخرة" value={String(overdue)} icon={FileWarning} tone="brand" />
        </div>

        {showBI && (
          <>
            <RevenueAreaChart data={monthlyRevenue} />
            <div className="grid lg:grid-cols-2 gap-4">
              <PieChartCard data={statusDistribution} title="توزيع حالة الفواتير" />
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>تصدير سريع</CardTitle>
                    <CardSubtitle>تصدير تقرير الإيرادات الحالي بصيغة PDF</CardSubtitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted leading-relaxed mb-4">
                    يمكنك طباعة أو تصدير أي فاتورة كملف PDF من خلال الضغط على &quot;عرض وتصدير&quot; بجانب كل فاتورة
                    في الجدول أدناه، أو استخدام أمر الطباعة من المتصفح لتصدير هذا التقرير كاملًا.
                  </p>
                  <button onClick={() => window.print()} className="text-sm font-semibold text-brand-700 hover:underline">
                    طباعة هذه الصفحة
                  </button>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>الفواتير</CardTitle>
              <CardSubtitle>{scopedInvoices.length} فاتورة</CardSubtitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
                {["الكل", "مدفوعة", "معلقة", "متأخرة"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <div className="relative w-52">
                <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pe-9" />
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadCsv("الفواتير", exportRows())}>
                <Download size={15} /> تصدير CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadExcel("الفواتير", "الفواتير", exportRows())}>
                <FileSpreadsheet size={15} /> تصدير Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الرقم</Th>
                  <Th>العميل</Th>
                  <Th>العقار</Th>
                  <Th>المبلغ</Th>
                  <Th>تاريخ الاستحقاق</Th>
                  <Th>الحالة</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map((inv) => (
                  <Tr key={inv.id}>
                    <Td className="font-semibold text-brand-700">{inv.number}</Td>
                    <Td>{inv.clientName}</Td>
                    <Td className="max-w-[180px] truncate text-muted">{inv.propertyTitle}</Td>
                    <Td className="font-semibold">{currency(inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</Td>
                    <Td className="text-muted">{inv.dueDate}</Td>
                    <Td><Badge>{inv.status}</Badge></Td>
                    <Td>
                      <Link href={`/reports/invoices/${inv.id}/print`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                        <Eye size={14} /> عرض وتصدير
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
