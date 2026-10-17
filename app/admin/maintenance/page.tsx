"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useMaintenanceRequests, useProperties, useTechnicians, useVendors } from "@/lib/firestore/hooks";
import { updateMaintenanceRequest } from "@/lib/firestore/mutations";
import type { MaintenanceStatus } from "@/lib/types";
import { CheckCircle2, ClipboardList, Search, Wrench } from "lucide-react";

export default function AdminMaintenancePage() {
  const { data: requests } = useMaintenanceRequests();
  const { data: properties } = useProperties();
  const { data: technicians } = useTechnicians();
  const { data: vendors } = useVendors();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("الكل");
  const [priority, setPriority] = useState("الكل");

  const propertyTitleById = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties]);

  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          (status === "الكل" || r.status === status) &&
          (priority === "الكل" || r.priority === priority) &&
          (r.title.includes(query) || r.tenantName.includes(query) || (propertyTitleById.get(r.propertyId) ?? "").includes(query))
      ),
    [requests, query, status, priority, propertyTitleById]
  );

  const newCount = requests.filter((r) => r.status === "جديد").length;
  const inProgress = requests.filter((r) => r.status === "قيد التنفيذ").length;
  const completed = requests.filter((r) => r.status === "مكتمل").length;

  return (
    <DashboardShell allow={["admin", "maintenanceStaff", "custom"]} customResource="maintenanceRequests" title="طلبات الصيانة">
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="إجمالي الطلبات" value={String(requests.length)} icon={ClipboardList} tone="brand" />
          <StatCard label="جديدة" value={String(newCount)} icon={Wrench} tone="info" />
          <StatCard label="قيد التنفيذ" value={String(inProgress)} icon={Wrench} tone="warning" />
          <StatCard label="مكتملة" value={String(completed)} icon={CheckCircle2} tone="success" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>كل طلبات الصيانة</CardTitle>
              <CardSubtitle>{filtered.length} من {requests.length} طلب — عيّن فنيًا داخليًا أو مورّدًا خارجيًا لكل طلب</CardSubtitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32">
                {["الكل", "جديد", "قيد التنفيذ", "مكتمل"].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-32">
                {["الكل", "عاجل", "متوسط", "منخفض"].map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
              <div className="relative w-52">
                <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pe-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الطلب</Th>
                  <Th>العقار</Th>
                  <Th>المستأجر</Th>
                  <Th>الأولوية</Th>
                  <Th>الفني الداخلي</Th>
                  <Th>المورّد الخارجي</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.length === 0 && (
                  <Tr>
                    <Td colSpan={7} className="text-center text-muted py-6">لا توجد طلبات مطابقة</Td>
                  </Tr>
                )}
                {filtered.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold max-w-[200px]">
                      <span className="block truncate">{r.title}</span>
                      <span className="block text-xs text-muted truncate">{r.description}</span>
                    </Td>
                    <Td className="text-muted max-w-[160px] truncate">{propertyTitleById.get(r.propertyId) ?? "—"}</Td>
                    <Td className="text-muted">{r.tenantName}</Td>
                    <Td><Badge>{r.priority}</Badge></Td>
                    <Td>
                      <Select
                        value={r.technicianId ?? ""}
                        onChange={(e) => updateMaintenanceRequest(r.id, { technicianId: e.target.value || null })}
                        className="w-36 py-1.5 text-xs"
                      >
                        <option value="">— غير معيّن —</option>
                        {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </Select>
                    </Td>
                    <Td>
                      <Select
                        value={r.vendorId ?? ""}
                        onChange={(e) => updateMaintenanceRequest(r.id, { vendorId: e.target.value || null })}
                        className="w-36 py-1.5 text-xs"
                      >
                        <option value="">— غير معيّن —</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </Select>
                    </Td>
                    <Td>
                      <Select
                        value={r.status}
                        onChange={(e) => updateMaintenanceRequest(r.id, { status: e.target.value as MaintenanceStatus })}
                        className="w-32 py-1.5 text-xs"
                      >
                        <option value="جديد">جديد</option>
                        <option value="قيد التنفيذ">قيد التنفيذ</option>
                        <option value="مكتمل">مكتمل</option>
                      </Select>
                    </Td>
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
