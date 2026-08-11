"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useExpenses, useProperties } from "@/lib/firestore/hooks";
import { createExpense } from "@/lib/firestore/mutations";
import type { ExpenseCategory } from "@/lib/types";
import { Plus, Receipt, TrendingDown, Wallet } from "lucide-react";

const CATEGORIES: ExpenseCategory[] = ["صيانة", "كهرباء", "مياه", "تنظيف", "أمن", "تأمين", "رسوم حكومية", "أخرى"];

export default function AdminExpensesPage() {
  const { data: expenses } = useExpenses();
  const { data: properties } = useProperties();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [propertyId, setPropertyId] = useState("");
  const [expCategory, setExpCategory] = useState<ExpenseCategory>("صيانة");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendorName, setVendorName] = useState("");
  const [notes, setNotes] = useState("");

  const propertyTitleById = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties]);

  const filtered = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (category === "الكل" || e.category === category) &&
          (propertyTitleById.get(e.propertyId) ?? "").includes(query)
      ),
    [expenses, category, query, propertyTitleById]
  );

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const paid = expenses.filter((e) => e.status === "مدفوعة").reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter((e) => e.status === "معلقة").reduce((s, e) => s + e.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const property = properties.find((p) => p.id === propertyId);
    if (!property || !amount) return;
    setSubmitting(true);
    await createExpense({
      propertyId: property.id,
      ownerId: property.ownerId,
      category: expCategory,
      amount: Number(amount),
      date,
      vendorName: vendorName || undefined,
      notes: notes || undefined,
      status: "معلقة",
    });
    setSubmitting(false);
    setShowForm(false);
    setPropertyId("");
    setExpCategory("صيانة");
    setAmount("");
    setVendorName("");
    setNotes("");
  }

  return (
    <DashboardShell allow={["admin"]} title="المصروفات">
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="إجمالي المصروفات" value={currency(total)} icon={Wallet} tone="brand" />
          <StatCard label="مدفوعة" value={currency(paid)} icon={Receipt} tone="success" />
          <StatCard label="معلقة" value={currency(pending)} icon={TrendingDown} tone="warning" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>سجل المصروفات</CardTitle>
              <CardSubtitle>{expenses.length} مصروف على مستوى المحفظة العقارية</CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-36">
                {["الكل", ...CATEGORIES].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Input placeholder="بحث بالعقار" value={query} onChange={(e) => setQuery(e.target.value)} className="w-44" />
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> مصروف جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العقار</Th>
                  <Th>الفئة</Th>
                  <Th>المورّد</Th>
                  <Th>المبلغ</Th>
                  <Th>التاريخ</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.length === 0 && (
                  <Tr>
                    <Td colSpan={6} className="text-center text-muted py-6">لا توجد مصروفات مطابقة</Td>
                  </Tr>
                )}
                {filtered.map((e) => (
                  <Tr key={e.id}>
                    <Td className="font-semibold max-w-[200px] truncate">{propertyTitleById.get(e.propertyId) ?? "—"}</Td>
                    <Td>{e.category}</Td>
                    <Td className="text-muted">{e.vendorName ?? "—"}</Td>
                    <Td className="font-semibold">{currency(e.amount)}</Td>
                    <Td className="text-muted">{e.date}</Td>
                    <Td><Badge>{e.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>تسجيل مصروف جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="property">العقار</Label>
                  <Select id="property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
                    <option value="" disabled>اختر عقارًا</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <Select id="category" value={expCategory} onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">المبلغ (﷼)</Label>
                  <Input id="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="date">التاريخ</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="vendor">المورّد (اختياري)</Label>
                  <Input id="vendor" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button type="submit" disabled={submitting} className="sm:col-span-3 self-start">
                  {submitting ? "جارِ الحفظ..." : "حفظ المصروف"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
