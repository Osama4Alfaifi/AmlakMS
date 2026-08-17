"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useOwners, useProperties, useUnits } from "@/lib/firestore/hooks";
import type { PropertyStatus } from "@/lib/types";
import { CheckCircle2, DoorOpen, Percent, Wrench } from "lucide-react";

// One row per unit, or per standalone property when it has no units — same
// row model as app/admin/listings, since occupancy is a per-listing concept
// and most properties now branch into units (see Unit/Property in
// lib/types.ts). Reading Property.status/listingType alone (the old
// behavior) went blind the moment a property got units.
interface OccupancyRow {
  id: string;
  propertyTitle: string;
  unitLabel: string;
  type: string;
  city: string;
  district: string;
  ownerId: string;
  listingType: "إيجار" | "بيع" | "استثمار";
  status: PropertyStatus;
}

export default function AdminOccupancyPage() {
  const { data: properties } = useProperties();
  const { data: units } = useUnits();
  const { data: owners } = useOwners();
  const [city, setCity] = useState("الكل");
  const [status, setStatus] = useState("الكل");

  const unitsByProperty = useMemo(() => {
    const map = new Map<string, typeof units>();
    units.forEach((u) => map.set(u.propertyId, [...(map.get(u.propertyId) ?? []), u]));
    return map;
  }, [units]);

  const rows: OccupancyRow[] = useMemo(() => {
    const list: OccupancyRow[] = [];
    properties.forEach((p) => {
      const propertyUnits = unitsByProperty.get(p.id) ?? [];
      if (propertyUnits.length === 0) {
        list.push({
          id: p.id,
          propertyTitle: p.title,
          unitLabel: "—",
          type: p.type,
          city: p.city,
          district: p.district,
          ownerId: p.ownerId,
          listingType: p.listingType,
          status: p.status,
        });
      } else {
        propertyUnits.forEach((u) => {
          list.push({
            id: u.id,
            propertyTitle: p.title,
            unitLabel: u.unitNumber,
            type: u.type,
            city: p.city,
            district: p.district,
            ownerId: u.ownerId,
            listingType: u.listingType,
            status: u.status,
          });
        });
      }
    });
    return list;
  }, [properties, unitsByProperty]);

  const cities = ["الكل", ...Array.from(new Set(properties.map((p) => p.city)))];
  const statuses = ["الكل", "مؤجرة", "متاحة", "تحت الصيانة", "مباعة"];

  // "Occupancy" is a rental concept — a sold unit isn't vacant/occupied, so
  // the stat cards (not the table below) count rental listings only, same
  // as the original property-only version of this page.
  const rentalRows = useMemo(() => rows.filter((r) => r.listingType === "إيجار"), [rows]);
  const occupied = rentalRows.filter((r) => r.status === "مؤجرة").length;
  const vacant = rentalRows.filter((r) => r.status === "متاحة").length;
  const underMaintenance = rentalRows.filter((r) => r.status === "تحت الصيانة").length;
  const occupancyRate = rentalRows.length ? Math.round((occupied / rentalRows.length) * 100) : 0;

  const filtered = useMemo(
    () => rows.filter((r) => (city === "الكل" || r.city === city) && (status === "الكل" || r.status === status)),
    [rows, city, status]
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
              <CardSubtitle>{filtered.length} من {rows.length} وحدة/عقار</CardSubtitle>
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
                  <Th>الوحدة</Th>
                  <Th>النوع</Th>
                  <Th>المدينة / الحي</Th>
                  <Th>المالك</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold">{r.propertyTitle}</Td>
                    <Td className="text-muted">{r.unitLabel}</Td>
                    <Td>{r.type}</Td>
                    <Td className="text-muted">{r.city} · {r.district}</Td>
                    <Td className="text-muted">{owners.find((o) => o.id === r.ownerId)?.name ?? "—"}</Td>
                    <Td><Badge>{r.status}</Badge></Td>
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
