"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { supportTickets } from "@/lib/mock-data";
import type { Priority, Role, SupportTicket, TicketCategory, TicketStatus } from "@/lib/types";
import { CheckCircle2, CircleDot, Loader2, Plus } from "lucide-react";

export function TicketBoard({
  category,
  allow,
  title,
}: {
  category: TicketCategory;
  allow: Role[];
  title: string;
}) {
  const [tickets, setTickets] = useState<SupportTicket[]>(supportTickets.filter((t) => t.category === category));
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [priority, setPriority] = useState<Priority>("متوسط");
  const [description, setDescription] = useState("");

  const open = tickets.filter((t) => t.status === "مفتوحة").length;
  const inProgress = tickets.filter((t) => t.status === "قيد المعالجة").length;
  const closed = tickets.filter((t) => t.status === "مغلقة").length;

  const nextNumber = useMemo(() => `TCK-${3000 + tickets.length + supportTickets.length}`, [tickets.length]);

  function updateStatus(id: string, status: TicketStatus) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !from.trim()) return;
    const ticket: SupportTicket = {
      id: `tk-new-${Date.now()}`,
      number: nextNumber,
      subject,
      category,
      from,
      priority,
      status: "مفتوحة",
      createdAt: new Date().toISOString().slice(0, 10),
      description,
    };
    setTickets((prev) => [ticket, ...prev]);
    setShowForm(false);
    setSubject("");
    setFrom("");
    setDescription("");
    setPriority("متوسط");
  }

  return (
    <DashboardShell allow={allow} title={title}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="تذاكر مفتوحة" value={String(open)} icon={CircleDot} tone="info" />
          <StatCard label="قيد المعالجة" value={String(inProgress)} icon={Loader2} tone="warning" />
          <StatCard label="تذاكر مغلقة" value={String(closed)} icon={CheckCircle2} tone="success" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardSubtitle>{tickets.length} تذكرة إجمالية</CardSubtitle>
            </div>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              <Plus size={15} /> تذكرة جديدة
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الرقم</Th>
                  <Th>الموضوع</Th>
                  <Th>مقدم الطلب</Th>
                  <Th>الأولوية</Th>
                  <Th>تاريخ الإنشاء</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {tickets.length === 0 && (
                  <Tr>
                    <Td colSpan={6} className="text-center text-muted py-6">لا توجد تذاكر حاليًا</Td>
                  </Tr>
                )}
                {tickets.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-semibold text-brand-700">{t.number}</Td>
                    <Td className="max-w-[220px]">
                      <span className="block font-medium truncate">{t.subject}</span>
                      <span className="block text-xs text-muted truncate">{t.description}</span>
                    </Td>
                    <Td className="text-muted">{t.from}</Td>
                    <Td><Badge>{t.priority}</Badge></Td>
                    <Td className="text-muted">{t.createdAt}</Td>
                    <Td>
                      <Select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value as TicketStatus)} className="w-32 py-1.5 text-xs">
                        <option value="مفتوحة">مفتوحة</option>
                        <option value="قيد المعالجة">قيد المعالجة</option>
                        <option value="مغلقة">مغلقة</option>
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
              <CardTitle>فتح تذكرة جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                <Input placeholder="الموضوع" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                <Input placeholder="اسم مقدم الطلب" value={from} onChange={(e) => setFrom(e.target.value)} required />
                <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  <option value="منخفض">منخفض</option>
                  <option value="متوسط">متوسط</option>
                  <option value="عاجل">عاجل</option>
                </Select>
                <Input placeholder="وصف مختصر" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Button type="submit" className="sm:col-span-2 self-start">إرسال التذكرة</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
