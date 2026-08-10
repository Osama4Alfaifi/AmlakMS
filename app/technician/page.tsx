"use client";

import { useMemo } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth-context";
import { useFirestoreDoc, useMaintenanceRequests, useProperties } from "@/lib/firestore/hooks";
import { claimMaintenanceRequest, updateMaintenanceRequest } from "@/lib/firestore/mutations";
import type { MaintenanceStatus, Technician } from "@/lib/types";
import { CheckCircle2, ClipboardList, Star, Wrench } from "lucide-react";

export default function TechnicianDashboardPage() {
  const { user } = useAuth();
  const currentTechnician = useFirestoreDoc<Technician>("technicians", user?.linkedId ?? undefined);
  const { data: requests } = useMaintenanceRequests();
  const { data: properties } = useProperties();

  const myTasks = useMemo(
    () => (currentTechnician ? requests.filter((r) => r.technicianId === currentTechnician.id) : []),
    [requests, currentTechnician]
  );
  const unassigned = useMemo(() => requests.filter((r) => r.technicianId === null), [requests]);

  if (!currentTechnician) return null;

  const inProgress = myTasks.filter((r) => r.status === "قيد التنفيذ").length;
  const completed = myTasks.filter((r) => r.status === "مكتمل").length;

  return (
    <DashboardShell allow={["technician"]} title={`أهلًا، ${currentTechnician.name}`}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="مهامي" value={String(myTasks.length)} icon={ClipboardList} tone="brand" />
          <StatCard label="قيد التنفيذ" value={String(inProgress)} icon={Wrench} tone="warning" />
          <StatCard label="مكتملة" value={String(completed)} icon={CheckCircle2} tone="success" />
          <StatCard label="التقييم" value={currentTechnician.rating.toFixed(1)} icon={Star} tone="accent" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>أوامر العمل المسندة إليّ</CardTitle>
              <CardSubtitle>{myTasks.length} أمر عمل — تخصص {currentTechnician.specialty}</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الطلب</Th>
                  <Th>العقار</Th>
                  <Th>الأولوية</Th>
                  <Th>الموعد</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myTasks.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-muted py-6">لا توجد مهام مسندة حاليًا</Td>
                  </Tr>
                )}
                {myTasks.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold max-w-[200px]">
                      <span className="block truncate">{r.title}</span>
                      <span className="block text-xs text-muted truncate">{r.description}</span>
                    </Td>
                    <Td className="text-muted max-w-[160px] truncate">{properties.find((p) => p.id === r.propertyId)?.title}</Td>
                    <Td><Badge>{r.priority}</Badge></Td>
                    <Td className="text-muted">{r.scheduledDate ?? "—"}</Td>
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

        <Card>
          <CardHeader>
            <div>
              <CardTitle>طلبات بانتظار تعيين فني</CardTitle>
              <CardSubtitle>{unassigned.length} طلب متاح</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الطلب</Th>
                  <Th>العقار</Th>
                  <Th>الأولوية</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {unassigned.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-muted py-6">لا توجد طلبات بانتظار تعيين</Td>
                  </Tr>
                )}
                {unassigned.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold">{r.title}</Td>
                    <Td className="text-muted max-w-[160px] truncate">{properties.find((p) => p.id === r.propertyId)?.title}</Td>
                    <Td><Badge>{r.priority}</Badge></Td>
                    <Td>
                      <button
                        onClick={() => claimMaintenanceRequest(r.id, currentTechnician.id)}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                      >
                        استلام الطلب
                      </button>
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
