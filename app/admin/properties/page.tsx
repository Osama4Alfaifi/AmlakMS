"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency, getOwnerById, properties } from "@/lib/mock-data";
import { Search } from "lucide-react";

export default function AdminPropertiesPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("الكل");
  const cities = ["الكل", ...Array.from(new Set(properties.map((p) => p.city)))];

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) => (city === "الكل" || p.city === city) && (p.title.includes(query) || p.district.includes(query))
      ),
    [query, city]
  );

  return (
    <DashboardShell allow={["admin"]} title="العقارات">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>جميع العقارات</CardTitle>
            <CardSubtitle>{properties.length} عقار مُدار عبر المنصة</CardSubtitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={city} onChange={(e) => setCity(e.target.value)} className="w-36">
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <div className="relative w-52">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>العقار</Th>
                <Th>النوع</Th>
                <Th>المدينة / الحي</Th>
                <Th>المساحة</Th>
                <Th>السعر</Th>
                <Th>المالك</Th>
                <Th>الحالة</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-semibold">{p.title}</Td>
                  <Td>{p.type}</Td>
                  <Td className="text-muted">{p.city} · {p.district}</Td>
                  <Td>{p.area} م²</Td>
                  <Td className="font-semibold">{currency(p.price)}{p.listingType === "إيجار" && <span className="text-muted font-normal">/سنويًا</span>}</Td>
                  <Td className="text-muted">{getOwnerById(p.ownerId)?.name}</Td>
                  <Td><Badge>{p.status}</Badge></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
