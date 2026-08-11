"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useClients, useProperties, useViewings } from "@/lib/firestore/hooks";
import { createViewing, updateLeadStage, updateViewingStatus } from "@/lib/firestore/mutations";
import type { LeadStage, ViewingStatus } from "@/lib/types";
import { CalendarClock, Plus, UserPlus } from "lucide-react";

const STAGES: LeadStage[] = ["جديد", "تواصل أولي", "معاينة مجدولة", "عرض مقدم", "تم التحويل لمستأجر", "مرفوض"];

export default function AdminLeadsPage() {
  const { data: clients } = useClients();
  const { data: properties } = useProperties();
  const { data: viewings } = useViewings();

  const leads = useMemo(() => clients.filter((c) => c.type === "عميل محتمل"), [clients]);
  const propertyTitleById = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties]);
  const leadNameById = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const converted = leads.filter((l) => l.stage === "تم التحويل لمستأجر").length;
  const scheduled = viewings.filter((v) => v.status === "مجدولة").length;

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !propertyId) return;
    setSubmitting(true);
    await createViewing({
      leadId,
      propertyId,
      scheduledAt,
      status: "مجدولة",
      notes: notes || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    await updateLeadStage(leadId, "معاينة مجدولة");
    setSubmitting(false);
    setShowForm(false);
    setLeadId("");
    setPropertyId("");
    setNotes("");
  }

  return (
    <DashboardShell allow={["admin", "leasingAgent"]} title="العملاء المحتملون">
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="عملاء محتملون" value={String(leads.length)} icon={UserPlus} tone="brand" />
          <StatCard label="معاينات مجدولة" value={String(scheduled)} icon={CalendarClock} tone="info" />
          <StatCard label="تم تحويلهم لمستأجرين" value={String(converted)} icon={UserPlus} tone="success" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>مسار المبيعات (CRM)</CardTitle>
              <CardSubtitle>{leads.length} عميل محتمل — غيّر المرحلة يدويًا أو عبر جدولة معاينة</CardSubtitle>
            </div>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              <Plus size={15} /> جدولة معاينة
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الاسم</Th>
                  <Th>الجوال</Th>
                  <Th>البريد الإلكتروني</Th>
                  <Th>تاريخ الانضمام</Th>
                  <Th>المرحلة</Th>
                </Tr>
              </THead>
              <TBody>
                {leads.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-muted py-6">لا يوجد عملاء محتملون حاليًا</Td>
                  </Tr>
                )}
                {leads.map((l) => (
                  <Tr key={l.id}>
                    <Td className="font-semibold">{l.name}</Td>
                    <Td className="text-muted" dir="ltr">{l.phone}</Td>
                    <Td className="text-muted">{l.email}</Td>
                    <Td className="text-muted">{l.joinedAt}</Td>
                    <Td>
                      <Select
                        value={l.stage ?? "جديد"}
                        onChange={(e) => updateLeadStage(l.id, e.target.value as LeadStage)}
                        className="w-40 py-1.5 text-xs"
                      >
                        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>جدولة معاينة</CardTitle>
              <CardSubtitle>ستُنقل مرحلة العميل المحتمل تلقائيًا إلى "معاينة مجدولة"</CardSubtitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="lead">العميل المحتمل</Label>
                  <Select id="lead" value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
                    <option value="" disabled>اختر عميلًا</option>
                    {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="viewProperty">العقار</Label>
                  <Select id="viewProperty" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
                    <option value="" disabled>اختر عقارًا</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="viewDate">تاريخ المعاينة</Label>
                  <Input id="viewDate" type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="viewNotes">ملاحظات</Label>
                  <Input id="viewNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button type="submit" disabled={submitting} className="sm:col-span-4 self-start">
                  {submitting ? "جارِ الحفظ..." : "حفظ المعاينة"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>المعاينات</CardTitle>
              <CardSubtitle>{viewings.length} معاينة</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العميل المحتمل</Th>
                  <Th>العقار</Th>
                  <Th>التاريخ</Th>
                  <Th>ملاحظات</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {viewings.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-muted py-6">لا توجد معاينات مجدولة</Td>
                  </Tr>
                )}
                {viewings.map((v) => (
                  <Tr key={v.id}>
                    <Td className="font-semibold">{leadNameById.get(v.leadId) ?? "—"}</Td>
                    <Td className="text-muted max-w-[180px] truncate">{propertyTitleById.get(v.propertyId) ?? "—"}</Td>
                    <Td className="text-muted">{v.scheduledAt}</Td>
                    <Td className="text-muted max-w-[200px] truncate">{v.notes ?? "—"}</Td>
                    <Td>
                      <Select
                        value={v.status}
                        onChange={(e) => updateViewingStatus(v.id, e.target.value as ViewingStatus)}
                        className="w-32 py-1.5 text-xs"
                      >
                        <option value="مجدولة">مجدولة</option>
                        <option value="مكتملة">مكتملة</option>
                        <option value="ملغاة">ملغاة</option>
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
