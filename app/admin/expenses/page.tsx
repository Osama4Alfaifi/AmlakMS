"use client";

import { Fragment, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useExpenses, useProperties } from "@/lib/firestore/hooks";
import { createExpense, updateExpenseStatus } from "@/lib/firestore/mutations";
import type { ExpenseCategory, ExpenseItem } from "@/lib/types";
import { CheckCircle2, ChevronDown, ChevronUp, Plus, Receipt, TrendingDown, Trash2, Wallet } from "lucide-react";

const CATEGORIES: ExpenseCategory[] = ["صيانة", "كهرباء", "مياه", "تنظيف", "أمن", "تأمين", "رسوم حكومية", "أخرى"];

function itemsTotal(items: ExpenseItem[]) {
  return items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
}

export default function AdminExpensesPage() {
  const { data: expenses } = useExpenses();
  const { data: properties } = useProperties();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [propertyId, setPropertyId] = useState("");
  const [expCategory, setExpCategory] = useState<ExpenseCategory>("صيانة");
  const [items, setItems] = useState<ExpenseItem[]>([{ description: "", amount: 0 }]);
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

  function updateItem(index: number, patch: Partial<ExpenseItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", amount: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const property = properties.find((p) => p.id === propertyId);
    const validItems = items.filter((i) => i.description.trim() && i.amount > 0);
    if (!property || validItems.length === 0) return;
    setSubmitting(true);
    await createExpense({
      propertyId: property.id,
      ownerId: property.ownerId,
      category: expCategory,
      items: validItems,
      amount: itemsTotal(validItems),
      date,
      vendorName: vendorName || undefined,
      notes: notes || undefined,
      status: "معلقة",
    });
    setSubmitting(false);
    setShowForm(false);
    setPropertyId("");
    setExpCategory("صيانة");
    setItems([{ description: "", amount: 0 }]);
    setVendorName("");
    setNotes("");
  }

  return (
    <DashboardShell allow={["admin", "accountant"]} title="المصروفات">
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
              <CardSubtitle>{expenses.length} مصروف على مستوى المحفظة العقارية — اضغط على أي صف لعرض التفاصيل</CardSubtitle>
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
                  <Th></Th>
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
                    <Td colSpan={7} className="text-center text-muted py-6">لا توجد مصروفات مطابقة</Td>
                  </Tr>
                )}
                {filtered.map((e) => {
                  const isOpen = expandedId === e.id;
                  return (
                    <Fragment key={e.id}>
                      <Tr className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : e.id)}>
                        <Td className="w-8 text-muted">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Td>
                        <Td className="font-semibold max-w-[200px] truncate">{propertyTitleById.get(e.propertyId) ?? "—"}</Td>
                        <Td>{e.category}</Td>
                        <Td className="text-muted">{e.vendorName ?? "—"}</Td>
                        <Td className="font-semibold">{currency(e.amount)}</Td>
                        <Td className="text-muted">{e.date}</Td>
                        <Td onClick={(ev) => ev.stopPropagation()}>
                          {e.status === "معلقة" ? (
                            <button
                              onClick={() => {
                                if (confirm(`هل تريد تأكيد اعتماد دفع مصروف بقيمة ${e.amount.toLocaleString("ar-SA")} ﷼؟`)) {
                                  updateExpenseStatus(e.id, "مدفوعة");
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                            >
                              <CheckCircle2 size={13} /> اعتماد الدفع
                            </button>
                          ) : (
                            <Badge>{e.status}</Badge>
                          )}
                        </Td>
                      </Tr>
                      {isOpen && (
                        <Tr className="bg-background">
                          <Td colSpan={7} className="py-3 whitespace-normal align-top">
                            <div className="pr-8">
                              <p className="text-xs font-semibold text-muted mb-2">تفصيل المبلغ ({e.items?.length ?? 0} بند)</p>
                              <table className="w-full text-sm max-w-md">
                                <tbody>
                                  {(e.items ?? []).map((item, idx) => (
                                    <tr key={idx} className="border-b border-border/60">
                                      <td className="py-1.5 text-muted">{item.description}</td>
                                      <td className="py-1.5 text-left font-medium">{currency(item.amount)}</td>
                                    </tr>
                                  ))}
                                  <tr>
                                    <td className="py-1.5 font-semibold">الإجمالي</td>
                                    <td className="py-1.5 text-left font-bold text-brand-700">{currency(e.amount)}</td>
                                  </tr>
                                </tbody>
                              </table>
                              {e.notes && <p className="text-xs text-muted mt-2">ملاحظات: {e.notes}</p>}
                            </div>
                          </Td>
                        </Tr>
                      )}
                    </Fragment>
                  );
                })}
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-4 gap-4">
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
                    <Label htmlFor="date">التاريخ</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="vendor">المورّد (اختياري)</Label>
                    <Input id="vendor" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label>تفصيل المبلغ (بند لكل تكلفة فرعية)</Label>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_140px_36px] gap-2 items-center">
                      <Input
                        placeholder="مثال: دهانات، خلاطات، أجرة عمل"
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="المبلغ (﷼)"
                        value={item.amount || ""}
                        onChange={(e) => updateItem(idx, { amount: Number(e.target.value) })}
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
                    إجمالي المصروف: <span className="font-bold text-foreground">{currency(itemsTotal(items))}</span>
                  </p>
                  <Button type="submit" disabled={submitting}>{submitting ? "جارِ الحفظ..." : "حفظ المصروف"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
