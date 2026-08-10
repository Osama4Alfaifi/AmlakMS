"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { systemUsers } from "@/lib/mock-data";
import { Search } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  owner: "مالك",
  tenant: "مستأجر",
  technician: "فني صيانة",
  "مدير حساب": "مدير حساب",
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      systemUsers.filter(
        (u) => u.name.includes(query) || u.email.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <DashboardShell allow={["admin"]} title="عدد المستخدمين">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>جميع المستخدمين</CardTitle>
            <CardSubtitle>{systemUsers.length} مستخدم مسجّل في النظام</CardSubtitle>
          </div>
          <div className="relative w-56">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="بحث بالاسم أو البريد" value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>الاسم</Th>
                <Th>البريد الإلكتروني</Th>
                <Th>الدور</Th>
                <Th>الحالة</Th>
                <Th>آخر دخول</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-semibold">{u.name}</Td>
                  <Td className="text-muted">{u.email}</Td>
                  <Td>{roleLabels[u.role] ?? u.role}</Td>
                  <Td><Badge tone={u.status === "نشط" ? "success" : "danger"}>{u.status}</Badge></Td>
                  <Td className="text-muted">{u.lastLogin}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
