"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { currency } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { computeNotifications } from "@/lib/notifications";
import { useContracts, useExpenses, useInvoices, useProperties } from "@/lib/firestore/hooks";
import { ArrowLeft, BarChart3, Bell, FileWarning, Receipt, TrendingDown, Wallet } from "lucide-react";

export default function AccountantDashboardPage() {
  const { user } = useAuth();
  const { data: expenses } = useExpenses();
  const { data: invoices } = useInvoices();
  const { data: contracts } = useContracts();
  const { data: properties } = useProperties();

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === "معلقة").reduce((s, e) => s + e.amount, 0);
  const collected = invoices.filter((i) => i.status === "مدفوعة").reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);
  const pendingRevenue = invoices.filter((i) => i.status !== "مدفوعة").reduce((s, i) => s + i.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0), 0);
  const allNotifications = computeNotifications(contracts, properties);
  const notifications = allNotifications.slice(0, 6);

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
              <CardTitle className="flex items-center gap-1.5"><Bell size={16} /> الإشعارات</CardTitle>
              <CardSubtitle>عقود قرب الانتهاء ودفعات مستحقة، الأقدم أولًا</CardSubtitle>
            </div>
            {allNotifications.length > notifications.length && (
              <Link href="/admin/audit-log" className="text-xs font-semibold text-brand-700 hover:underline">
                عرض الكل ({allNotifications.length})
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted py-2">لا توجد إشعارات حاليًا</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 text-sm">
                    <Badge tone={n.type === "عقد قرب الانتهاء" ? "warning" : "info"}>{n.type}</Badge>
                    <span className="flex-1">{n.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>الوصول السريع</CardTitle>
              <CardSubtitle>إدارة العقود والمصروفات والفواتير والسندات والتقارير</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              <Link href="/admin/contracts">
                <Button variant="outline" className="w-full justify-between">
                  العقود <ArrowLeft size={15} />
                </Button>
              </Link>
              <Link href="/admin/expenses">
                <Button variant="outline" className="w-full justify-between">
                  المصروفات <ArrowLeft size={15} />
                </Button>
              </Link>
              <Link href="/admin/vouchers">
                <Button variant="outline" className="w-full justify-between">
                  <Receipt size={15} className="ml-1" /> السندات <ArrowLeft size={15} />
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
              <Link href="/admin/audit-log">
                <Button variant="outline" className="w-full justify-between">
                  <FileWarning size={15} className="ml-1" /> سجل العمليات <ArrowLeft size={15} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
