"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { BarChartCard, PieChartCard, RevenueAreaChart } from "@/components/charts/Charts";
import { currency, monthlyRevenue } from "@/lib/mock-data";
import {
  useClients,
  useContracts,
  useExpenses,
  useProperties,
  useSupportTickets,
  useSystemUsers,
} from "@/lib/firestore/hooks";
import { Building2, Contact, FileText, Users, Wallet } from "lucide-react";
import Link from "next/link";

export default function AdminOverviewPage() {
  const { data: properties } = useProperties();
  const { data: contracts } = useContracts();
  const { data: clients } = useClients();
  const { data: systemUsers } = useSystemUsers();
  const { data: supportTickets } = useSupportTickets();
  const { data: expenses } = useExpenses();
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const activeContracts = contracts.filter((c) => c.status === "نشط").length;
  const openTickets = supportTickets.filter((t) => t.status !== "مغلقة").length;

  const cityMap = new Map<string, number>();
  properties.forEach((p) => cityMap.set(p.city, (cityMap.get(p.city) ?? 0) + 1));
  const cityDistribution = Array.from(cityMap, ([name, value]) => ({ name, عقارات: value }));

  const typeMap = new Map<string, number>();
  properties.forEach((p) => typeMap.set(p.type, (typeMap.get(p.type) ?? 0) + 1));
  const propertyTypeDistribution = Array.from(typeMap, ([name, value]) => ({ name, value }));

  const contractsByStatus = ["نشط", "منتهي", "قيد التجديد"].map((s) => ({
    name: s,
    value: contracts.filter((c) => c.status === s).length,
  }));

  return (
    <DashboardShell allow={["admin"]}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/admin/users">
            <StatCard label="عدد المستخدمين" value={String(systemUsers.length)} icon={Users} tone="brand" trend={{ value: "6%", positive: true }} />
          </Link>
          <Link href="/admin/properties">
            <StatCard label="عدد العقارات" value={String(properties.length)} icon={Building2} tone="info" trend={{ value: "4 جديد", positive: true }} />
          </Link>
          <Link href="/admin/contracts">
            <StatCard label="العقود النشطة" value={String(activeContracts)} icon={FileText} tone="success" trend={{ value: "2%", positive: false }} />
          </Link>
          <Link href="/admin/clients">
            <StatCard label="عدد العملاء" value={String(clients.length)} icon={Contact} tone="accent" trend={{ value: "9%", positive: true }} />
          </Link>
          <Link href="/admin/expenses">
            <StatCard label="إجمالي المصروفات" value={currency(totalExpenses)} icon={Wallet} tone="warning" />
          </Link>
        </div>

        <RevenueAreaChart data={monthlyRevenue} />

        <div className="grid lg:grid-cols-2 gap-4">
          <BarChartCard data={cityDistribution} title="توزيع العقارات حسب المدينة" dataKey="عقارات" color="#2c7e96" />
          <PieChartCard data={propertyTypeDistribution} title="توزيع العقارات حسب النوع" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <PieChartCard data={contractsByStatus} title="حالة العقود" subtitle={`${contracts.length} عقد إجمالي`} />

          <Card>
            <CardHeader>
              <div>
                <CardTitle>تذاكر الدعم الأخيرة</CardTitle>
                <CardSubtitle>{openTickets} تذكرة مفتوحة حاليًا</CardSubtitle>
              </div>
              <Link href="/support/customer" className="text-xs font-semibold text-brand-700 hover:underline">
                عرض الكل
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <Tr>
                    <Th>الرقم</Th>
                    <Th>الموضوع</Th>
                    <Th>الأولوية</Th>
                    <Th>الحالة</Th>
                  </Tr>
                </THead>
                <TBody>
                  {supportTickets.slice(0, 5).map((t) => (
                    <Tr key={t.id}>
                      <Td className="font-semibold text-brand-700">{t.number}</Td>
                      <Td className="max-w-[220px] truncate">{t.subject}</Td>
                      <Td><Badge>{t.priority}</Badge></Td>
                      <Td><Badge>{t.status}</Badge></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
