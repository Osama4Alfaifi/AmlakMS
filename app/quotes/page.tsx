"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useFirestoreDoc, useProperties, useQuotes } from "@/lib/firestore/hooks";
import { createQuote } from "@/lib/firestore/mutations";
import { CURRENT_OWNER_ID } from "@/lib/demo-identity";
import type { InvoiceItem, Owner } from "@/lib/types";
import { Eye, Plus, Trash2 } from "lucide-react";

function totalOf(items: InvoiceItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return subtotal + subtotal * taxRate;
}

export default function QuotesPage() {
  const { user } = useAuth();
  const { data: allQuotes } = useQuotes();
  const { data: properties } = useProperties();
  const currentOwner = useFirestoreDoc<Owner>("owners", user?.role === "owner" ? CURRENT_OWNER_ID : undefined);

  // Owners only see quotes tied to their own properties; admin sees all.
  const quotesList = useMemo(() => {
    if (user?.role !== "owner") return allQuotes;
    if (!currentOwner) return [];
    const myTitles = new Set(properties.filter((p) => p.ownerId === currentOwner.id).map((p) => p.title));
    return allQuotes.filter((q) => myTitles.has(q.propertyTitle));
  }, [allQuotes, properties, user?.role, currentOwner]);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [clientName, setClientName] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  function updateItem(index: number, patch: Partial<InvoiceItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !propertyTitle.trim()) return;
    setSubmitting(true);
    const number = `QT-${new Date().getFullYear()}-${String(200 + allQuotes.length + 1).padStart(3, "0")}`;
    await createQuote({
      number,
      clientName,
      propertyTitle,
      items: items.filter((i) => i.description.trim()),
      taxRate: 0.15,
      status: "مسودة",
      createdAt: new Date().toISOString().slice(0, 10),
      validUntil: validUntil || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      notes,
    });
    setSubmitting(false);
    setShowForm(false);
    setClientName("");
    setPropertyTitle("");
    setValidUntil("");
    setNotes("");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
  }

  return (
    <DashboardShell allow={["admin", "owner"]} title="عروض الأسعار">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>عروض الأسعار</CardTitle>
              <CardSubtitle>
                {quotesList.length} عرض سعر {user?.role === "owner" ? "لعقاراتك" : "— قابلة للتصدير كملف PDF"}
              </CardSubtitle>
            </div>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              <Plus size={15} /> عرض سعر جديد
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الرقم</Th>
                  <Th>العميل</Th>
                  <Th>العقار / الخدمة</Th>
                  <Th>الإجمالي</Th>
                  <Th>صالح حتى</Th>
                  <Th>الحالة</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {quotesList.map((q) => (
                  <Tr key={q.id}>
                    <Td className="font-semibold text-brand-700">{q.number}</Td>
                    <Td>{q.clientName}</Td>
                    <Td className="max-w-[200px] truncate text-muted">{q.propertyTitle}</Td>
                    <Td className="font-semibold">{currency(totalOf(q.items, q.taxRate))}</Td>
                    <Td className="text-muted">{q.validUntil}</Td>
                    <Td><Badge>{q.status}</Badge></Td>
                    <Td>
                      <Link href={`/quotes/${q.id}/print`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                        <Eye size={14} /> عرض وتصدير
                      </Link>
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
              <div>
                <CardTitle>إنشاء عرض سعر جديد</CardTitle>
                <CardSubtitle>سيُنشأ رقم مرجعي تلقائيًا للعرض</CardSubtitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="clientName">اسم العميل</Label>
                    <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="propertyTitle">العقار / الخدمة</Label>
                    <Input id="propertyTitle" value={propertyTitle} onChange={(e) => setPropertyTitle(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">صالح حتى</Label>
                    <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label>بنود العرض</Label>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_90px_120px_36px] gap-2 items-center">
                      <Input
                        placeholder="الوصف"
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                      />
                      <Input
                        type="number"
                        min={1}
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="سعر الوحدة"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                      />
                      <button type="button" onClick={() => removeItem(idx)} className="text-danger-500 hover:text-danger-700 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="self-start">
                    <Plus size={14} /> إضافة بند
                  </Button>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted">
                    الإجمالي شامل الضريبة (15%):{" "}
                    <span className="font-bold text-foreground">{currency(totalOf(items, 0.15))}</span>
                  </p>
                  <Button type="submit" disabled={submitting}>{submitting ? "جارِ الحفظ..." : "حفظ عرض السعر"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
