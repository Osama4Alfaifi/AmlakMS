"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { useContracts, useOwners, useProperties, useTenants } from "@/lib/firestore/hooks";
import { Download, Search } from "lucide-react";

export default function AdminContractsPage() {
  const { data: contracts } = useContracts();
  const { data: properties } = useProperties();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("الكل");
  const statuses = ["الكل", "نشط", "منتهي", "قيد التجديد"];

  const enriched = useMemo(
    () =>
      contracts.map((c) => ({
        contract: c,
        propertyTitle: properties.find((p) => p.id === c.propertyId)?.title ?? "",
        ownerName: owners.find((o) => o.id === c.ownerId)?.name ?? "",
        tenantName: tenants.find((t) => t.id === c.tenantId)?.name ?? "",
      })),
    [contracts, properties, owners, tenants]
  );

  const filtered = useMemo(
    () =>
      enriched.filter(
        ({ contract: c, propertyTitle, ownerName, tenantName }) =>
          (status === "الكل" || c.status === status) &&
          (c.id.includes(query) || propertyTitle.includes(query) || ownerName.includes(query) || tenantName.includes(query))
      ),
    [enriched, query, status]
  );

  return (
    <DashboardShell allow={["admin"]} title="العقود">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>جميع العقود</CardTitle>
            <CardSubtitle>{filtered.length} من {contracts.length} عقد إيجار وبيع مسجّل</CardSubtitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <div className="relative w-52">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv("العقود", filtered.map(({ contract: c, propertyTitle, ownerName, tenantName }) => ({
                  "رقم العقد": c.id.toUpperCase(),
                  العقار: propertyTitle,
                  المالك: ownerName,
                  المستأجر: tenantName,
                  النوع: c.type,
                  القيمة: c.value,
                  البداية: c.startDate,
                  النهاية: c.endDate,
                  الحالة: c.status,
                })))
              }
            >
              <Download size={15} /> تصدير CSV
            </Button>
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
              {filtered.map(({ contract: c, propertyTitle, ownerName, tenantName }) => (
                <Tr key={c.id}>
                  <Td className="font-semibold text-brand-700">{c.id.toUpperCase()}</Td>
                  <Td className="max-w-[180px] truncate">{propertyTitle}</Td>
                  <Td className="text-muted">{ownerName}</Td>
                  <Td className="text-muted">{tenantName || "—"}</Td>
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
