"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth-context";
import { useClients, useProperties, useViewings } from "@/lib/firestore/hooks";
import { ArrowLeft, CalendarClock, UserPlus, Users } from "lucide-react";

export default function LeasingAgentDashboardPage() {
  const { user } = useAuth();
  const { data: clients } = useClients();
  const { data: properties } = useProperties();
  const { data: viewings } = useViewings();

  const leads = useMemo(() => clients.filter((c) => c.type === "عميل محتمل"), [clients]);
  const propertyTitleById = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties]);
  const leadNameById = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const upcoming = viewings.filter((v) => v.status === "مجدولة");
  const converted = leads.filter((l) => l.stage === "تم التحويل لمستأجر").length;

  return (
    <DashboardShell allow={["leasingAgent"]} title={`أهلًا، ${user?.name ?? ""}`}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="عملاء محتملون" value={String(leads.length)} icon={UserPlus} tone="brand" />
          <StatCard label="معاينات قادمة" value={String(upcoming.length)} icon={CalendarClock} tone="info" />
          <StatCard label="تم تحويلهم لمستأجرين" value={String(converted)} icon={Users} tone="success" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>المعاينات القادمة</CardTitle>
              <CardSubtitle>{upcoming.length} معاينة مجدولة</CardSubtitle>
            </div>
            <Link href="/admin/leads">
              <Button size="sm" variant="outline">
                إدارة العملاء المحتملين <ArrowLeft size={15} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العميل المحتمل</Th>
                  <Th>العقار</Th>
                  <Th>التاريخ</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {upcoming.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-muted py-6">لا توجد معاينات قادمة</Td>
                  </Tr>
                )}
                {upcoming.map((v) => (
                  <Tr key={v.id}>
                    <Td className="font-semibold">{leadNameById.get(v.leadId) ?? "—"}</Td>
                    <Td className="text-muted max-w-[200px] truncate">{propertyTitleById.get(v.propertyId) ?? "—"}</Td>
                    <Td className="text-muted">{v.scheduledAt}</Td>
                    <Td><Badge>{v.status}</Badge></Td>
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
