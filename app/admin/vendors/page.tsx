"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useVendors } from "@/lib/firestore/hooks";
import { createVendor } from "@/lib/firestore/mutations";
import { Plus, Search } from "lucide-react";

export default function AdminVendorsPage() {
  const { data: vendors } = useVendors();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(
    () => vendors.filter((v) => v.name.includes(query) || v.category.includes(query)),
    [vendors, query]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !phone.trim()) return;
    setSubmitting(true);
    await createVendor({
      name,
      category,
      phone,
      email: email || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setShowForm(false);
    setName("");
    setCategory("");
    setPhone("");
    setEmail("");
    setNotes("");
  }

  return (
    <DashboardShell allow={["admin", "maintenanceStaff"]} title="المورّدون">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>دليل المورّدين</CardTitle>
              <CardSubtitle>{vendors.length} مورّد/شركة خارجية — يمكن ربطهم بطلبات الصيانة</CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث بالاسم أو الفئة" value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
              </div>
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> مورّد جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الاسم</Th>
                  <Th>الفئة</Th>
                  <Th>الجوال</Th>
                  <Th>البريد الإلكتروني</Th>
                  <Th>ملاحظات</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-muted py-6">لا يوجد مورّدون مطابقون</Td>
                  </Tr>
                )}
                {filtered.map((v) => (
                  <Tr key={v.id}>
                    <Td className="font-semibold">{v.name}</Td>
                    <Td>{v.category}</Td>
                    <Td className="text-muted" dir="ltr">{v.phone}</Td>
                    <Td className="text-muted">{v.email ?? "—"}</Td>
                    <Td className="text-muted max-w-[220px] truncate">{v.notes ?? "—"}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>مورّد جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vname">اسم المورّد/الشركة</Label>
                  <Input id="vname" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="vcategory">الفئة</Label>
                  <Input id="vcategory" placeholder="مثال: مقاول صيانة، شركة أمن" value={category} onChange={(e) => setCategory(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="vphone">الجوال</Label>
                  <Input id="vphone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="vemail">البريد الإلكتروني (اختياري)</Label>
                  <Input id="vemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="vnotes">ملاحظات</Label>
                  <Input id="vnotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button type="submit" disabled={submitting} className="sm:col-span-3 self-start">
                  {submitting ? "جارِ الحفظ..." : "حفظ المورّد"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
