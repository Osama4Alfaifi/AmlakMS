"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { useAuth } from "@/lib/auth-context";
import { computeNotifications } from "@/lib/notifications";
import { useAllUserProfiles, useAppSettings, useMyAuditLogs, useOwnerContracts, useOwnerProperties, useTenants } from "@/lib/firestore/hooks";
import type { AuditAction } from "@/lib/types";
import { Search } from "lucide-react";

const ACTION_LABEL: Record<AuditAction, string> = { create: "إنشاء", update: "تحديث", delete: "حذف" };

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
  contracts: "عقد",
  vouchers: "سند",
  tenants: "مستأجر",
  users: "مستخدم",
  properties: "عقار",
  settings: "إعدادات",
  roles: "دور مخصص",
};

interface Row {
  id: string;
  timestamp: string;
  actorName: string;
  actionLabel: string;
  actionTone: "success" | "info" | "warning" | "danger";
  entityLabel: string;
  detail: string;
}

export default function AdminAuditLogPage() {
  const { user } = useAuth();
  const scope = useAccountantOwnerScope();
  // Admin sees every actor's entries (pass null → unconstrained); anyone
  // else sees only their own (see firestore.rules).
  const { data: logs } = useMyAuditLogs(user?.role === "admin" ? null : user?.uid);
  const { data: profiles } = useAllUserProfiles();
  const { data: contracts } = useOwnerContracts(scope.queryOwnerId);
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: tenants } = useTenants();
  const settings = useAppSettings();

  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("الكل");

  const profileByUid = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const rows = useMemo<Row[]>(() => {
    const realRows: Row[] = logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      actorName: profileByUid.get(l.actorUid)?.name ?? l.actorUid.slice(0, 8),
      actionLabel: ACTION_LABEL[l.action],
      actionTone: l.action === "create" ? "success" : l.action === "delete" ? "danger" : "info",
      entityLabel: ENTITY_TYPE_LABEL[l.entityType] ?? l.entityType,
      detail: l.label ?? "—",
    }));

    const reminderRows: Row[] = computeNotifications(contracts, properties, tenants, {
      contract: settings?.notificationLeadDays ?? 30,
      payment: 14,
    }).map((n) => ({
      id: n.id,
      timestamp: `${n.date}T00:00:00.000Z`,
      actorName: "—",
      actionLabel: "تذكير",
      actionTone: "warning",
      entityLabel: n.type,
      detail: n.message,
    }));

    return [...realRows, ...reminderRows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [logs, profileByUid, contracts, properties, tenants, settings]);

  const entityTypes = useMemo(() => ["الكل", ...Array.from(new Set(rows.map((r) => r.entityLabel)))], [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (entityType === "الكل" || r.entityLabel === entityType) &&
          (r.actorName.includes(query) || r.detail.includes(query) || r.entityLabel.includes(query))
      ),
    [rows, entityType, query]
  );

  return (
    <DashboardShell allow={["admin", "accountant"]} title="سجل العمليات">
      <div className="flex flex-col gap-6">
        <Card>
        <CardHeader>
          <div>
            <CardTitle>سجل العمليات</CardTitle>
            <CardSubtitle>
              {filtered.length} من {rows.length} عملية — يشمل التذكيرات المحسوبة (عقود قرب الانتهاء ودفعات مستحقة)
              {user?.role !== "admin" && " — العمليات المعروضة هي عملياتك فقط"}
            </CardSubtitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-44">
              {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
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
              {filtered.map((r) => (
                <Tr key={r.id}>
                  <Td className="text-muted whitespace-nowrap">{new Date(r.timestamp).toLocaleString("ar-SA")}</Td>
                  <Td className="font-semibold">{r.actorName}</Td>
                  <Td><Badge tone={r.actionTone}>{r.actionLabel}</Badge></Td>
                  <Td>{r.entityLabel}</Td>
                  <Td className="text-muted max-w-[320px] truncate">{r.detail}</Td>
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
