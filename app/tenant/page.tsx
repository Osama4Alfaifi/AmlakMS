"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import {
  useContracts,
  useFirestoreDoc,
  useInvoices,
  useMyMaintenanceRequests,
  useProperties,
} from "@/lib/firestore/hooks";
import type { Tenant } from "@/lib/types";
import { CalendarClock, FileText, Receipt, Wrench } from "lucide-react";

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const currentTenant = useFirestoreDoc<Tenant>("tenants", user?.linkedId ?? undefined);
  const { data: contracts } = useContracts();
  const { data: properties } = useProperties();
  const { data: invoices } = useInvoices();
  const { data: myMaintenance } = useMyMaintenanceRequests(user?.uid);

  if (!currentTenant) return null;

  const contract = contracts.find((c) => c.id === currentTenant.contractId);
  const property = properties.find((p) => p.id === currentTenant.propertyId);
  const myInvoices = invoices.filter((i) => i.clientName === currentTenant.name);
  const openMaintenance = myMaintenance.filter((m) => m.status !== "مكتمل");
  const pendingInvoice = myInvoices.find((i) => i.status !== "مدفوعة");

  const daysLeft = contract
    ? Math.max(0, Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <DashboardShell allow={["tenant"]} title={`أهلًا، ${currentTenant.name}`}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="الأيام المتبقية للعقد" value={String(daysLeft)} icon={CalendarClock} tone="brand" />
          <StatCard label="قيمة العقد" value={contract ? currency(contract.value) : "—"} icon={FileText} tone="info" />
          <StatCard label="فاتورة مستحقة" value={pendingInvoice ? currency(pendingInvoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)) : "لا يوجد"} icon={Receipt} tone="warning" />
          <StatCard label="طلبات صيانة نشطة" value={String(openMaintenance.length)} icon={Wrench} tone="accent" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>عقد الإيجار الحالي</CardTitle>
              <CardSubtitle>تفاصيل العقار والعقد المرتبط بحسابك</CardSubtitle>
            </div>
            {contract && <Badge>{contract.status}</Badge>}
          </CardHeader>
          <CardContent>
            {property && contract ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted mb-1">العقار</p>
                  <p className="font-semibold">{property.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">الموقع</p>
                  <p className="font-semibold">{property.city} · {property.district}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">تاريخ البداية</p>
                  <p className="font-semibold">{contract.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">تاريخ الانتهاء</p>
                  <p className="font-semibold">{contract.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">دورة الدفع</p>
                  <p className="font-semibold">{contract.paymentCycle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">قيمة العقد</p>
                  <p className="font-semibold">{currency(contract.value)}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted text-sm">لا يوجد عقد نشط حاليًا</p>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>فواتيري</CardTitle>
                <CardSubtitle>{myInvoices.length} فاتورة</CardSubtitle>
              </div>
              <Link href="/reports" className="text-xs font-semibold text-brand-700 hover:underline">عرض الكل</Link>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <Tr>
                    <Th>الرقم</Th>
                    <Th>المبلغ</Th>
                    <Th>الاستحقاق</Th>
                    <Th>الحالة</Th>
                  </Tr>
                </THead>
                <TBody>
                  {myInvoices.map((inv) => (
                    <Tr key={inv.id}>
                      <Td className="font-semibold text-brand-700">{inv.number}</Td>
                      <Td className="font-semibold">{currency(inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</Td>
                      <Td className="text-muted">{inv.dueDate}</Td>
                      <Td><Badge>{inv.status}</Badge></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>طلبات الصيانة</CardTitle>
                <CardSubtitle>{myMaintenance.length} طلب</CardSubtitle>
              </div>
              <Link href="/tenant/maintenance">
                <Button size="sm">طلب صيانة جديد</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <Tr>
                    <Th>الطلب</Th>
                    <Th>الأولوية</Th>
                    <Th>الحالة</Th>
                  </Tr>
                </THead>
                <TBody>
                  {myMaintenance.length === 0 && (
                    <Tr>
                      <Td colSpan={3} className="text-center text-muted py-6">لا توجد طلبات صيانة</Td>
                    </Tr>
                  )}
                  {myMaintenance.map((m) => (
                    <Tr key={m.id}>
                      <Td className="font-semibold">{m.title}</Td>
                      <Td><Badge>{m.priority}</Badge></Td>
                      <Td><Badge>{m.status}</Badge></Td>
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
