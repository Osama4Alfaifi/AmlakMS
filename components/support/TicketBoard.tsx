"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth-context";
import { useMySupportTickets, useSupportTicketsByCategory } from "@/lib/firestore/hooks";
import { createSupportTicket, updateSupportTicketStatus } from "@/lib/firestore/mutations";
import type { Priority, Role, TicketCategory, TicketStatus } from "@/lib/types";
import { CheckCircle2, CircleDot, Loader2, Plus, Search } from "lucide-react";

export function TicketBoard({
  category,
  allow,
  title,
}: {
  category: TicketCategory;
  allow: Role[];
  title: string;
}) {
  const { user } = useAuth();

  // Staff = the team this category is routed to (they see every ticket in
  // it). Everyone else only ever sees the tickets they personally
  // submitted. These need two different Firestore queries — a `list` rule
  // must hold for the query as issued (see firestore.rules), so staff query
  // "where category == X" and everyone else queries "where createdByUid ==
  // me" — an unconstrained fetch-everything-then-filter wouldn't satisfy
  // the rule for a non-staff sender.
  const isStaff = user?.role === "admin";
  const { data: staffTickets } = useSupportTicketsByCategory(isStaff ? category : undefined);
  const { data: myTickets } = useMySupportTickets(!isStaff ? user?.uid : undefined);

  const tickets = useMemo(
    () => (isStaff ? staffTickets : myTickets.filter((t) => t.category === category)),
    [isStaff, staffTickets, myTickets, category]
  );

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [priority, setPriority] = useState<Priority>("متوسط");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");

  const open = tickets.filter((t) => t.status === "مفتوحة").length;
  const inProgress = tickets.filter((t) => t.status === "قيد المعالجة").length;
  const closed = tickets.filter((t) => t.status === "مغلقة").length;

  const filteredTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (statusFilter === "الكل" || t.status === statusFilter) &&
          (t.subject.includes(query) || t.from.includes(query) || t.number.includes(query))
      ),
    [tickets, query, statusFilter]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const senderName = isStaff ? from : user.name;
    if (!subject.trim() || !senderName.trim()) return;
    setSubmitting(true);
    await createSupportTicket({
      number: `TCK-${3000 + tickets.length + 1}`,
      subject,
      category,
      from: senderName,
      createdByUid: user.uid,
      priority,
      status: "مفتوحة",
      createdAt: new Date().toISOString().slice(0, 10),
      description,
    });
    setSubmitting(false);
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
              <CardSubtitle>
                {isStaff
                  ? `${filteredTickets.length} من ${tickets.length} تذكرة — كموظف مسؤول، تظهر لك كل التذاكر`
                  : `${filteredTickets.length} من ${tickets.length} تذكرة أرسلتها أنت فقط`}
              </CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
                {["الكل", "مفتوحة", "قيد المعالجة", "مغلقة"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <div className="relative w-48">
                <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pe-9" />
              </div>
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> تذكرة جديدة
              </Button>
            </div>
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
                {filteredTickets.length === 0 && (
                  <Tr>
                    <Td colSpan={6} className="text-center text-muted py-6">لا توجد تذاكر مطابقة</Td>
                  </Tr>
                )}
                {filteredTickets.map((t) => (
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
                      {isStaff ? (
                        <Select
                          value={t.status}
                          onChange={(e) => updateSupportTicketStatus(t.id, e.target.value as TicketStatus)}
                          className="w-32 py-1.5 text-xs"
                        >
                          <option value="مفتوحة">مفتوحة</option>
                          <option value="قيد المعالجة">قيد المعالجة</option>
                          <option value="مغلقة">مغلقة</option>
                        </Select>
                      ) : (
                        <Badge>{t.status}</Badge>
                      )}
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
                {isStaff ? (
                  <Input placeholder="اسم مقدم الطلب" value={from} onChange={(e) => setFrom(e.target.value)} required />
                ) : (
                  <div>
                    <Label>مقدم الطلب</Label>
                    <Input value={user?.name ?? ""} disabled />
                  </div>
                )}
                <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  <option value="منخفض">منخفض</option>
                  <option value="متوسط">متوسط</option>
                  <option value="عاجل">عاجل</option>
                </Select>
                <Input placeholder="وصف مختصر" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Button type="submit" disabled={submitting} className="sm:col-span-2 self-start">
                  {submitting ? "جارِ الإرسال..." : "إرسال التذكرة"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
