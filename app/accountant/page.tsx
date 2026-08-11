"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { currency } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useExpenses, useInvoices } from "@/lib/firestore/hooks";
import { ArrowLeft, BarChart3, FileWarning, Receipt, TrendingDown, Wallet } from "lucide-react";

export default function AccountantDashboardPage() {
  const { user } = useAuth();
  const { data: expenses } = useExpenses();
  const { data: invoices } = useInvoices();

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === "معلقة").reduce((s, e) => s + e.amount, 0);
  const collected = invoices.filter((i) => i.status === "مدفوعة").reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);
  const pendingRevenue = invoices.filter((i) => i.status !== "مدفوعة").reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);

  return (
    <DashboardShell allow={["accountant"]} title={`أهلًا، ${user?.name ?? ""}`}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="الإيرادات المحصّلة" value={currency(collected)} icon={Wallet} tone="success" />
          <StatCard label="مستحقات معلقة" value={currency(pendingRevenue)} icon={FileWarning} tone="warning" />
          <StatCard label="إجمالي المصروفات" value={currency(totalExpenses)} icon={TrendingDown} tone="brand" />
          <StatCard label="مصروفات بانتظار الاعتماد" value={currency(pendingExpenses)} icon={Receipt} tone="info" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>الوصول السريع</CardTitle>
              <CardSubtitle>إدارة المصروفات والفواتير والتقارير المالية</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              <Link href="/admin/expenses">
                <Button variant="outline" className="w-full justify-between">
                  المصروفات <ArrowLeft size={15} />
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full justify-between">
                  التقارير والفواتير <ArrowLeft size={15} />
                </Button>
              </Link>
              <Link href="/admin/reports/financial">
                <Button variant="outline" className="w-full justify-between">
                  <BarChart3 size={15} className="ml-1" /> التقارير المالية <ArrowLeft size={15} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
