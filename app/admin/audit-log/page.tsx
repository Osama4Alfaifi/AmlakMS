"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAllUserProfiles, useAuditLogs } from "@/lib/firestore/hooks";
import type { AuditAction } from "@/lib/types";
import { Search } from "lucide-react";

const ACTION_LABEL: Record<AuditAction, string> = { create: "إنشاء", update: "تحديث" };

const ENTITY_TYPE_LABEL: Record<string, string> = {
  expenses: "مصروف",
  quotes: "عرض سعر",
  supportTickets: "تذكرة دعم",
  maintenanceRequests: "طلب صيانة",
  buildings: "مبنى",
  units: "وحدة",
  vendors: "مورّد",
  clients: "عميل",
  viewings: "معاينة",
  documentLinks: "مستند",
};

export default function AdminAuditLogPage() {
  const { data: logs } = useAuditLogs();
  const { data: profiles } = useAllUserProfiles();

  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("الكل");

  const profileByUid = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const entityTypes = useMemo(() => ["الكل", ...Array.from(new Set(logs.map((l) => l.entityType)))], [logs]);

  const sorted = useMemo(() => [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [logs]);

  const filtered = useMemo(
    () =>
      sorted.filter((l) => {
        const actorName = profileByUid.get(l.actorUid)?.name ?? "";
        return (
          (entityType === "الكل" || l.entityType === entityType) &&
          (actorName.includes(query) || (l.label ?? "").includes(query) || l.entityType.includes(query))
        );
      }),
    [sorted, entityType, query, profileByUid]
  );

  return (
    <DashboardShell allow={["admin"]} title="سجل التدقيق">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>سجل العمليات</CardTitle>
            <CardSubtitle>{filtered.length} من {logs.length} عملية مسجّلة تلقائيًا عبر النظام</CardSubtitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-40">
              {entityTypes.map((t) => (
                <option key={t} value={t}>{t === "الكل" ? "الكل" : ENTITY_TYPE_LABEL[t] ?? t}</option>
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
                <Th>الوقت</Th>
                <Th>الفاعل</Th>
                <Th>الفعل</Th>
                <Th>نوع الكيان</Th>
                <Th>التفاصيل</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.length === 0 && (
                <Tr>
                  <Td colSpan={5} className="text-center text-muted py-6">لا توجد عمليات مطابقة</Td>
                </Tr>
              )}
              {filtered.map((l) => {
                const actor = profileByUid.get(l.actorUid);
                return (
                  <Tr key={l.id}>
                    <Td className="text-muted whitespace-nowrap">{new Date(l.timestamp).toLocaleString("ar-SA")}</Td>
                    <Td className="font-semibold">{actor?.name ?? l.actorUid.slice(0, 8)}</Td>
                    <Td><Badge tone={l.action === "create" ? "success" : "info"}>{ACTION_LABEL[l.action]}</Badge></Td>
                    <Td>{ENTITY_TYPE_LABEL[l.entityType] ?? l.entityType}</Td>
                    <Td className="text-muted max-w-[280px] truncate">{l.label ?? "—"}</Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
