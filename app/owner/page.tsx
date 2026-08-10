"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { BarChartCard } from "@/components/charts/Charts";
import { currency } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useContracts, useFirestoreDoc, useOwnerMaintenanceRequests, useProperties, useTechnicians } from "@/lib/firestore/hooks";
import type { Owner } from "@/lib/types";
import { Building2, FileText, TrendingUp, Wrench } from "lucide-react";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const currentOwner = useFirestoreDoc<Owner>("owners", user?.linkedId ?? undefined);
  const { data: properties } = useProperties();
  const { data: contracts } = useContracts();
  const { data: myMaintenance } = useOwnerMaintenanceRequests(user?.linkedId);
  const { data: technicians } = useTechnicians();

  if (!currentOwner) return null;

  const myProperties = properties.filter((p) => p.ownerId === currentOwner.id);
  const myContracts = contracts.filter((c) => c.ownerId === currentOwner.id);
  const activeContracts = myContracts.filter((c) => c.status === "نشط");
  const annualIncome = activeContracts.reduce((sum, c) => sum + c.value, 0);
  const openMaintenance = myMaintenance.filter((m) => m.status !== "مكتمل");

  const incomeByProperty = myProperties.map((p) => ({
    name: p.title.split(" ").slice(0, 2).join(" "),
    "الدخل السنوي": contracts.find((c) => c.propertyId === p.id)?.value ?? 0,
  }));

  return (
    <DashboardShell allow={["owner"]} title={`أهلًا، ${currentOwner.name}`}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="عقاراتي" value={String(myProperties.length)} icon={Building2} tone="brand" />
          <StatCard label="عقود نشطة" value={String(activeContracts.length)} icon={FileText} tone="success" />
          <StatCard label="الدخل السنوي المتوقع" value={currency(annualIncome)} icon={TrendingUp} tone="accent" />
          <StatCard label="طلبات صيانة مفتوحة" value={String(openMaintenance.length)} icon={Wrench} tone="warning" />
        </div>

        <BarChartCard data={incomeByProperty} title="الدخل السنوي حسب العقار" dataKey="الدخل السنوي" color="#1c3ab3" />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>عقاراتي</CardTitle>
              <CardSubtitle>{myProperties.length} عقار مملوك</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العقار</Th>
                  <Th>المدينة</Th>
                  <Th>النوع</Th>
                  <Th>السعر</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myProperties.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-semibold">{p.title}</Td>
                    <Td className="text-muted">{p.city} · {p.district}</Td>
                    <Td>{p.type}</Td>
                    <Td className="font-semibold">{currency(p.price)}</Td>
                    <Td><Badge>{p.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>عقودي</CardTitle>
              <CardSubtitle>{myContracts.length} عقد إجمالي</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>رقم العقد</Th>
                  <Th>القيمة</Th>
                  <Th>البداية</Th>
                  <Th>النهاية</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myContracts.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-semibold text-brand-700">{c.id.toUpperCase()}</Td>
                    <Td className="font-semibold">{currency(c.value)}</Td>
                    <Td className="text-muted">{c.startDate}</Td>
                    <Td className="text-muted">{c.endDate}</Td>
                    <Td><Badge>{c.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>طلبات الصيانة على عقاراتي</CardTitle>
              <CardSubtitle>{myMaintenance.length} طلب</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الطلب</Th>
                  <Th>الأولوية</Th>
                  <Th>الفني</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myMaintenance.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-muted py-6">لا توجد طلبات صيانة حاليًا</Td>
                  </Tr>
                )}
                {myMaintenance.map((m) => (
                  <Tr key={m.id}>
                    <Td className="font-semibold">{m.title}</Td>
                    <Td><Badge>{m.priority}</Badge></Td>
                    <Td className="text-muted">{technicians.find((t) => t.id === m.technicianId)?.name ?? "غير معيّن"}</Td>
                    <Td><Badge>{m.status}</Badge></Td>
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
