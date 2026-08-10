"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useContracts, useOwners, useProperties, useTenants } from "@/lib/firestore/hooks";

export default function AdminContractsPage() {
  const { data: contracts } = useContracts();
  const { data: properties } = useProperties();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();

  return (
    <DashboardShell allow={["admin"]} title="العقود">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>جميع العقود</CardTitle>
            <CardSubtitle>{contracts.length} عقد إيجار وبيع مسجّل</CardSubtitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>رقم العقد</Th>
                <Th>العقار</Th>
                <Th>المالك</Th>
                <Th>المستأجر</Th>
                <Th>النوع</Th>
                <Th>القيمة</Th>
                <Th>البداية</Th>
                <Th>النهاية</Th>
                <Th>الحالة</Th>
              </Tr>
            </THead>
            <TBody>
              {contracts.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-semibold text-brand-700">{c.id.toUpperCase()}</Td>
                  <Td className="max-w-[180px] truncate">{properties.find((p) => p.id === c.propertyId)?.title}</Td>
                  <Td className="text-muted">{owners.find((o) => o.id === c.ownerId)?.name}</Td>
                  <Td className="text-muted">{tenants.find((t) => t.id === c.tenantId)?.name ?? "—"}</Td>
                  <Td>{c.type}</Td>
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
    </DashboardShell>
  );
}
