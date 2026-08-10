"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { clients } from "@/lib/mock-data";
import { Search } from "lucide-react";

export default function AdminClientsPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("الكل");

  const filtered = useMemo(
    () => clients.filter((c) => (type === "الكل" || c.type === type) && c.name.includes(query)),
    [query, type]
  );

  return (
    <DashboardShell allow={["admin"]} title="العملاء">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>قاعدة العملاء</CardTitle>
            <CardSubtitle>{clients.length} عميل (ملاك، مستأجرون، عملاء محتملون)</CardSubtitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-36">
              {["الكل", "مالك", "مستأجر", "عميل محتمل"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <div className="relative w-52">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input placeholder="بحث بالاسم" value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>الاسم</Th>
                <Th>النوع</Th>
                <Th>الجوال</Th>
                <Th>البريد الإلكتروني</Th>
                <Th>تاريخ الانضمام</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-semibold">{c.name}</Td>
                  <Td><Badge tone={c.type === "مالك" ? "brand" : c.type === "مستأجر" ? "info" : "neutral"}>{c.type}</Badge></Td>
                  <Td className="text-muted" dir="ltr">{c.phone}</Td>
                  <Td className="text-muted">{c.email}</Td>
                  <Td className="text-muted">{c.joinedAt}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
