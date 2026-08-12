"use client";

import { useMemo } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { LineTrendChart, RevenueAreaChart } from "@/components/charts/Charts";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { contractDisplayNumber } from "@/lib/contracts/display";
import { currency } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { downloadExcel } from "@/lib/excel";
import { useInvoices, useOwnerContracts, useOwnerExpenses, useOwnerProperties, useOwners, useTenants } from "@/lib/firestore/hooks";
import { Download, FileSpreadsheet, Percent, TrendingDown, TrendingUp, Wallet } from "lucide-react";

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${ARABIC_MONTHS[Number(month) - 1]} ${year}`;
}

export default function FinancialReportsPage() {
  const scope = useAccountantOwnerScope();
  const { data: invoices } = useInvoices();
  const { data: expenses } = useOwnerExpenses(scope.queryOwnerId);
  const { data: contracts } = useOwnerContracts(scope.queryOwnerId);
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();

  const totalCollected = invoices.filter((i) => i.status === "مدفوعة").reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);
  const totalInvoiced = invoices.reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netIncome = totalCollected - totalExpenses;
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
  const paidCount = invoices.filter((i) => i.status === "مدفوعة").length;

  const monthlyRows = useMemo(() => {
    const map = new Map<string, { revenue: number; expenses: number }>();
    invoices
      .filter((i) => i.status === "مدفوعة")
      .forEach((i) => {
        const key = monthKey(i.issueDate);
        const total = i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0);
        const entry = map.get(key) ?? { revenue: 0, expenses: 0 };
        entry.revenue += total;
        map.set(key, entry);
      });
    expenses
      .filter((e) => e.status === "مدفوعة")
      .forEach((e) => {
        const key = monthKey(e.date);
        const entry = map.get(key) ?? { revenue: 0, expenses: 0 };
        entry.expenses += e.amount;
        map.set(key, entry);
      });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ key, month: monthLabel(key), revenue: v.revenue, expenses: v.expenses, net: v.revenue - v.expenses }));
  }, [invoices, expenses]);

  const cashFlowData = useMemo(() => {
    let running = 0;
    return monthlyRows.map((r) => {
      running += r.net;
      return { month: r.month, "الرصيد التراكمي": running };
    });
  }, [monthlyRows]);

  const today = new Date().toISOString().slice(0, 10);
  const propertyTitleById = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties]);
  const tenantNameById = useMemo(() => new Map(tenants.map((t) => [t.id, t.name])), [tenants]);

  // Per-contract collection status — reads straight from each contract's
  // real payment schedule (dueDate/status), unlike the monthly rows above
  // which are derived from invoices.
  const contractRows = useMemo(
    () =>
      contracts.map((c) => {
        const payments = c.payments ?? [];
        const paid = payments.filter((p) => p.status === "مسددة");
        const unpaid = payments.filter((p) => p.status === "مستحقة");
        const late = unpaid.filter((p) => p.dueDate < today);
        const paidAmount = paid.reduce((s, p) => s + p.amount, 0);
        const remainingAmount = unpaid.reduce((s, p) => s + p.amount, 0);
        return {
          id: c.id,
          label: contractDisplayNumber(c),
          propertyTitle: propertyTitleById.get(c.propertyId) ?? "—",
          tenantName: tenantNameById.get(c.tenantId) ?? "—",
          ownerName: owners.find((o) => o.id === c.ownerId)?.name ?? "—",
          paymentsCount: payments.length,
          paidCount: paid.length,
          unpaidCount: unpaid.length,
          lateCount: late.length,
          totalValue: c.value,
          paidAmount,
          remainingAmount,
        };
      }),
    [contracts, propertyTitleById, tenantNameById, owners, today]
  );

  const contractTotals = contractRows.reduce(
    (acc, r) => ({
      paymentsCount: acc.paymentsCount + r.paymentsCount,
      paidCount: acc.paidCount + r.paidCount,
      unpaidCount: acc.unpaidCount + r.unpaidCount,
      lateCount: acc.lateCount + r.lateCount,
      totalValue: acc.totalValue + r.totalValue,
      paidAmount: acc.paidAmount + r.paidAmount,
      remainingAmount: acc.remainingAmount + r.remainingAmount,
    }),
    { paymentsCount: 0, paidCount: 0, unpaidCount: 0, lateCount: 0, totalValue: 0, paidAmount: 0, remainingAmount: 0 }
  );

  const contractExportRows = () =>
    contractRows.map((r) => ({
      "رقم العقد": r.label,
      العقار: r.propertyTitle,
      المستأجر: r.tenantName,
      المالك: r.ownerName,
      "عدد الدفعات": r.paymentsCount,
      "دفعات مسددة": r.paidCount,
      "دفعات مستحقة": r.unpaidCount,
      "دفعات متأخرة": r.lateCount,
      "القيمة الإجمالية": r.totalValue,
      المسدد: r.paidAmount,
      المتبقي: r.remainingAmount,
    }));

  return (
    <DashboardShell allow={["admin", "accountant"]} title="التقارير المالية">
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="الإيرادات المحصّلة" value={currency(totalCollected)} icon={Wallet} tone="success" />
          <StatCard label="إجمالي المصروفات" value={currency(totalExpenses)} icon={TrendingDown} tone="warning" />
          <StatCard label="صافي الدخل" value={currency(netIncome)} icon={TrendingUp} tone="brand" />
          <StatCard label="معدل التحصيل (بالقيمة)" value={`${collectionRate}%`} icon={Percent} tone="info" trend={{ value: `${paidCount}/${invoices.length} فاتورة`, positive: true }} />
        </div>

        <RevenueAreaChart
          data={monthlyRows.map((r) => ({ month: r.month, revenue: r.revenue, expenses: r.expenses }))}
          title="قائمة الدخل الشهرية"
          subtitle="محسوبة من الفواتير والمصروفات المدفوعة فعليًا"
        />

        <LineTrendChart
          data={cashFlowData}
          title="التدفق النقدي التراكمي"
          subtitle="صافي الرصيد المتراكم شهرًا بعد شهر"
          dataKey="الرصيد التراكمي"
          color="#1c3ab3"
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>التفصيل الشهري</CardTitle>
              <CardSubtitle>{monthlyRows.length} شهر يحتوي على حركة مالية</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الشهر</Th>
                  <Th>الإيرادات</Th>
                  <Th>المصروفات</Th>
                  <Th>الصافي</Th>
                </Tr>
              </THead>
              <TBody>
                {monthlyRows.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-muted py-6">لا توجد حركة مالية بعد</Td>
                  </Tr>
                )}
                {monthlyRows.map((r) => (
                  <Tr key={r.key}>
                    <Td className="font-semibold">{r.month}</Td>
                    <Td className="text-success-700">{currency(r.revenue)}</Td>
                    <Td className="text-danger-700">{currency(r.expenses)}</Td>
                    <Td className={`font-semibold ${r.net >= 0 ? "text-brand-700" : "text-danger-700"}`}>{currency(r.net)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>تقرير العقود التفصيلي</CardTitle>
              <CardSubtitle>{contractRows.length} عقد — حالة التحصيل الفعلية لكل عقد من جدول دفعاته الحقيقي</CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadCsv("تقرير العقود", contractExportRows())}>
                <Download size={15} /> تصدير CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadExcel("تقرير العقود", "العقود", contractExportRows())}>
                <FileSpreadsheet size={15} /> تصدير Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>رقم العقد</Th>
                  <Th>العقار</Th>
                  <Th>المستأجر</Th>
                  <Th>المالك</Th>
                  <Th>الدفعات</Th>
                  <Th>مسددة</Th>
                  <Th>متأخرة</Th>
                  <Th>القيمة الإجمالية</Th>
                  <Th>المسدد</Th>
                  <Th>المتبقي</Th>
                </Tr>
              </THead>
              <TBody>
                {contractRows.length === 0 && (
                  <Tr>
                    <Td colSpan={10} className="text-center text-muted py-6">لا توجد عقود بعد</Td>
                  </Tr>
                )}
                {contractRows.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold text-brand-700">{r.label}</Td>
                    <Td className="max-w-[160px] truncate">{r.propertyTitle}</Td>
                    <Td className="text-muted">{r.tenantName}</Td>
                    <Td className="text-muted">{r.ownerName}</Td>
                    <Td>{r.paymentsCount}</Td>
                    <Td className="text-success-700">{r.paidCount}</Td>
                    <Td className={r.lateCount > 0 ? "text-danger-700 font-semibold" : "text-muted"}>{r.lateCount}</Td>
                    <Td className="font-semibold">{currency(r.totalValue)}</Td>
                    <Td className="text-success-700">{currency(r.paidAmount)}</Td>
                    <Td className="font-semibold">{currency(r.remainingAmount)}</Td>
                  </Tr>
                ))}
                {contractRows.length > 0 && (
                  <Tr className="bg-background font-bold">
                    <Td colSpan={4}>الإجمالي</Td>
                    <Td>{contractTotals.paymentsCount}</Td>
                    <Td className="text-success-700">{contractTotals.paidCount}</Td>
                    <Td className={contractTotals.lateCount > 0 ? "text-danger-700" : ""}>{contractTotals.lateCount}</Td>
                    <Td>{currency(contractTotals.totalValue)}</Td>
                    <Td className="text-success-700">{currency(contractTotals.paidAmount)}</Td>
                    <Td>{currency(contractTotals.remainingAmount)}</Td>
                  </Tr>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
