"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { downloadExcel } from "@/lib/excel";
import { useAuth } from "@/lib/auth-context";
import { useFirestoreDoc, useOwnerQuotes } from "@/lib/firestore/hooks";
import { createQuote } from "@/lib/firestore/mutations";
import type { InvoiceItem, Owner } from "@/lib/types";
import { Download, Eye, FileSpreadsheet, Plus, Search, Trash2 } from "lucide-react";

function totalOf(items: InvoiceItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  return subtotal + subtotal * taxRate;
}

export default function QuotesPage() {
  const { user, ready } = useAuth();
  const currentOwner = useFirestoreDoc<Owner>("owners", user?.role === "owner" ? user.linkedId ?? undefined : undefined);
  // Owner-scoped at the query level (ownerId is set on every owner-created
  // quote — see handleSubmit) — null for admin gives the unconstrained
  // fetch it's entitled to via the wildcard rule. Gated on `ready` first so
  // an eventual owner never briefly fires the unconstrained branch before
  // their role is known (see the same note in app/map/page.tsx).
  const { data: quotesList } = useOwnerQuotes(!ready ? undefined : user?.role === "owner" ? user.linkedId ?? undefined : null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const quoteStatuses = ["الكل", "مسودة", "مرسل", "مقبول", "مرفوض"];

  const filteredQuotes = useMemo(
    () =>
      quotesList.filter(
        (q) =>
          (statusFilter === "الكل" || q.status === statusFilter) &&
          (q.number.includes(query) || q.clientName.includes(query) || q.propertyTitle.includes(query))
      ),
    [quotesList, query, statusFilter]
  );

  const exportRows = () =>
    filteredQuotes.map((q) => ({
      الرقم: q.number,
      العميل: q.clientName,
      "العقار / الخدمة": q.propertyTitle,
      الإجمالي: totalOf(q.items, q.taxRate),
      "صالح حتى": q.validUntil,
      الحالة: q.status,
    }));

  const [clientName, setClientName] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyCategory, setPropertyCategory] = useState<"سكني" | "تجاري">("سكني");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const taxRate = propertyCategory === "تجاري" ? 0.15 : 0;

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
    const number = `QT-${new Date().getFullYear()}-${String(200 + quotesList.length + 1).padStart(3, "0")}`;
    await createQuote({
      number,
      clientName,
      propertyTitle,
      // Tied to the creating owner regardless of what they typed in
      // propertyTitle — this is what firestore.rules actually checks, not
      // a match against the real property list (see the rules comment).
      ownerId: user?.role === "owner" ? currentOwner?.id : undefined,
      items: items.filter((i) => i.description.trim()),
      taxRate,
      status: "مسودة",
      createdAt: new Date().toISOString().slice(0, 10),
      validUntil: validUntil || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      notes,
    });
    setSubmitting(false);
    setShowForm(false);
    setClientName("");
    setPropertyTitle("");
    setPropertyCategory("سكني");
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
                {filteredQuotes.length} من {quotesList.length} عرض سعر {user?.role === "owner" ? "لعقاراتك" : "— قابلة للتصدير كملف PDF"}
              </CardSubtitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
                {quoteStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <div className="relative w-48">
                <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pe-9" />
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadCsv("عروض الأسعار", exportRows())}>
                <Download size={15} /> تصدير CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadExcel("عروض الأسعار", "عروض الأسعار", exportRows())}>
                <FileSpreadsheet size={15} /> تصدير Excel
              </Button>
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> عرض سعر جديد
              </Button>
            </div>
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
                {filteredQuotes.map((q) => (
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
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="clientName">اسم العميل</Label>
                    <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="propertyTitle">العقار / الخدمة</Label>
                    <Input id="propertyTitle" value={propertyTitle} onChange={(e) => setPropertyTitle(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="propertyCategory">نوع العقار</Label>
                    <Select
                      id="propertyCategory"
                      value={propertyCategory}
                      onChange={(e) => setPropertyCategory(e.target.value as "سكني" | "تجاري")}
                    >
                      <option value="سكني">سكني (معفى من الضريبة)</option>
                      <option value="تجاري">تجاري (+15% ضريبة)</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="validUntil">صالح حتى</Label>
                    <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label>بنود العرض</Label>
                  <div className="grid grid-cols-[1fr_90px_120px_36px] gap-2 text-xs font-semibold text-muted">
                    <span>الوصف</span>
                    <span>الكمية</span>
                    <span>سعر الوحدة</span>
                    <span></span>
                  </div>
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
                    {taxRate > 0 ? "الإجمالي شامل الضريبة (15%)" : "الإجمالي (معفى من الضريبة)"}:{" "}
                    <span className="font-bold text-foreground">{currency(totalOf(items, taxRate))}</span>
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
