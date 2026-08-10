"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { contracts, currency, getOwnerById, getPropertyById, tenants } from "@/lib/mock-data";

export default function AdminContractsPage() {
  function tenantName(id: string) {
    return tenants.find((t) => t.id === id)?.name ?? "—";
  }

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
                  <Td className="max-w-[180px] truncate">{getPropertyById(c.propertyId)?.title}</Td>
                  <Td className="text-muted">{getOwnerById(c.ownerId)?.name}</Td>
                  <Td className="text-muted">{tenantName(c.tenantId)}</Td>
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
