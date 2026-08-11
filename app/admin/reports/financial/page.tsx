"use client";

import { useMemo } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { LineTrendChart, RevenueAreaChart } from "@/components/charts/Charts";
import { currency } from "@/lib/mock-data";
import { useExpenses, useInvoices } from "@/lib/firestore/hooks";
import { Percent, TrendingDown, TrendingUp, Wallet } from "lucide-react";

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
  const { data: invoices } = useInvoices();
  const { data: expenses } = useExpenses();

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
      </div>
    </DashboardShell>
  );
}
