"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { maintenanceRequests, tenants } from "@/lib/mock-data";
import type { MaintenanceRequest, Priority } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

const currentTenant = tenants[0];

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(
    maintenanceRequests.filter((m) => m.tenantName === currentTenant.name)
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("متوسط");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const newRequest: MaintenanceRequest = {
      id: `mr-new-${Date.now()}`,
      propertyId: currentTenant.propertyId,
      tenantName: currentTenant.name,
      technicianId: null,
      title,
      description,
      priority,
      status: "جديد",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newRequest, ...prev]);
    setTitle("");
    setDescription("");
    setPriority("متوسط");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <DashboardShell allow={["tenant"]} title="طلبات الصيانة">
      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>تقديم طلب صيانة جديد</CardTitle>
              <CardSubtitle>سيتم تعيين فني صيانة مناسب لطلبك</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="title">عنوان المشكلة</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: عطل في التكييف" required />
              </div>
              <div>
                <Label htmlFor="priority">الأولوية</Label>
                <Select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  <option value="منخفض">منخفض</option>
                  <option value="متوسط">متوسط</option>
                  <option value="عاجل">عاجل</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">تفاصيل إضافية</Label>
                <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." />
              </div>
              <Button type="submit">إرسال الطلب</Button>
              {submitted && (
                <p className="flex items-center gap-1.5 text-success-700 text-xs font-semibold">
                  <CheckCircle2 size={15} /> تم إرسال طلبك بنجاح
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>طلباتي السابقة</CardTitle>
              <CardSubtitle>{requests.length} طلب</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الطلب</Th>
                  <Th>الأولوية</Th>
                  <Th>تاريخ الإنشاء</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {requests.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-muted py-6">لا توجد طلبات صيانة بعد</Td>
                  </Tr>
                )}
                {requests.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold max-w-[220px]">
                      <span className="block truncate">{r.title}</span>
                      {r.description && <span className="block text-xs text-muted truncate">{r.description}</span>}
                    </Td>
                    <Td><Badge>{r.priority}</Badge></Td>
                    <Td className="text-muted">{r.createdAt}</Td>
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
