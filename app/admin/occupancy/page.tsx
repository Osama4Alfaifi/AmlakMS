"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useOwners, useProperties } from "@/lib/firestore/hooks";
import { CheckCircle2, DoorOpen, Percent, Wrench } from "lucide-react";

export default function AdminOccupancyPage() {
  const { data: properties } = useProperties();
  const { data: owners } = useOwners();
  const [city, setCity] = useState("الكل");
  const [status, setStatus] = useState("الكل");

  const cities = ["الكل", ...Array.from(new Set(properties.map((p) => p.city)))];
  const statuses = ["الكل", "مؤجرة", "متاحة", "تحت الصيانة", "مباعة"];

  const rentalProperties = useMemo(() => properties.filter((p) => p.listingType === "إيجار"), [properties]);
  const occupied = rentalProperties.filter((p) => p.status === "مؤجرة").length;
  const vacant = rentalProperties.filter((p) => p.status === "متاحة").length;
  const underMaintenance = rentalProperties.filter((p) => p.status === "تحت الصيانة").length;
  const occupancyRate = rentalProperties.length ? Math.round((occupied / rentalProperties.length) * 100) : 0;

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) => (city === "الكل" || p.city === city) && (status === "الكل" || p.status === status)
      ),
    [properties, city, status]
  );

  return (
    <DashboardShell allow={["admin"]} title="الإشغال والشغور">
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="نسبة الإشغال" value={`${occupancyRate}%`} icon={Percent} tone="brand" />
          <StatCard label="وحدات مؤجرة" value={String(occupied)} icon={CheckCircle2} tone="success" />
          <StatCard label="وحدات شاغرة" value={String(vacant)} icon={DoorOpen} tone="info" />
          <StatCard label="تحت الصيانة" value={String(underMaintenance)} icon={Wrench} tone="warning" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>حالة الوحدات</CardTitle>
              <CardSubtitle>{filtered.length} من {properties.length} عقار</CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={city} onChange={(e) => setCity(e.target.value)} className="w-36">
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العقار</Th>
                  <Th>النوع</Th>
                  <Th>المدينة / الحي</Th>
                  <Th>المالك</Th>
                  <Th>السعر</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-semibold">{p.title}</Td>
                    <Td>{p.type}</Td>
                    <Td className="text-muted">{p.city} · {p.district}</Td>
                    <Td className="text-muted">{owners.find((o) => o.id === p.ownerId)?.name ?? "—"}</Td>
                    <Td className="font-semibold">{currency(p.price)}</Td>
                    <Td><Badge>{p.status}</Badge></Td>
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
