"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useVouchers } from "@/lib/firestore/hooks";
import { createVoucher } from "@/lib/firestore/mutations";
import type { VoucherMethod, VoucherType } from "@/lib/types";
import { Eye, Plus, Search } from "lucide-react";

const VOUCHER_TYPES: VoucherType[] = ["قبض", "صرف"];
const VOUCHER_METHODS: VoucherMethod[] = ["نقدًا", "تحويل بنكي"];

function emptyForm() {
  return {
    type: "قبض" as VoucherType,
    personName: "",
    amount: "",
    method: "نقدًا" as VoucherMethod,
    statement: "",
    date: new Date().toISOString().slice(0, 10),
    contractId: "",
    paymentNumber: "",
    periodFrom: "",
    periodTo: "",
  };
}

function VouchersPageInner() {
  const { data: vouchers } = useVouchers();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    const prefillType = searchParams.get("type");
    if (!prefillType) return;
    const paymentNumber = searchParams.get("paymentNumber") ?? "";
    const periodFrom = searchParams.get("periodFrom") ?? "";
    const periodTo = searchParams.get("periodTo") ?? "";
    const contractLabel = searchParams.get("contractLabel") ?? searchParams.get("contractId");
    setForm((f) => ({
      ...f,
      type: prefillType === "صرف" ? "صرف" : "قبض",
      personName: searchParams.get("personName") ?? f.personName,
      amount: searchParams.get("amount") ?? f.amount,
      contractId: searchParams.get("contractId") ?? f.contractId,
      paymentNumber,
      periodFrom,
      periodTo,
      statement: searchParams.get("contractId")
        ? `دفعة رقم ${paymentNumber} عن عقد ${contractLabel}${periodFrom && periodTo ? ` — عن الفترة من ${periodFrom} إلى ${periodTo}` : ""}`
        : f.statement,
    }));
    setShowForm(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(
    () =>
      vouchers.filter(
        (v) => (typeFilter === "الكل" || v.type === typeFilter) && (v.personName.includes(query) || v.number.includes(query))
      ),
    [vouchers, typeFilter, query]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.personName.trim() || !Number(form.amount)) return;
    setSubmitting(true);
    const sameType = vouchers.filter((v) => v.type === form.type).length;
    const prefix = form.type === "قبض" ? "RV" : "PV";
    const number = `${prefix}-${new Date().getFullYear()}-${String(sameType + 1).padStart(3, "0")}`;
    await createVoucher({
      number,
      type: form.type,
      personName: form.personName,
      amount: Number(form.amount),
      method: form.method,
      statement: form.statement,
      date: form.date,
      contractId: form.contractId || undefined,
      paymentNumber: form.paymentNumber || undefined,
      periodFrom: form.periodFrom || undefined,
      periodTo: form.periodTo || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setShowForm(false);
    setForm(emptyForm());
  }

  return (
    <DashboardShell allow={["admin", "accountant"]} title="السندات">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>سندات القبض والصرف</CardTitle>
              <CardSubtitle>{vouchers.length} سند</CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-32">
                {["الكل", ...VOUCHER_TYPES].map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <div className="relative w-52">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
              </div>
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> سند جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الرقم</Th>
                  <Th>النوع</Th>
                  <Th>الاسم</Th>
                  <Th>المبلغ</Th>
                  <Th>الطريقة</Th>
                  <Th>التاريخ</Th>
                  <Th></Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.length === 0 && (
                  <Tr>
                    <Td colSpan={7} className="text-center text-muted py-6">لا توجد سندات مطابقة</Td>
                  </Tr>
                )}
                {filtered.map((v) => (
                  <Tr key={v.id}>
                    <Td className="font-semibold text-brand-700">{v.number}</Td>
                    <Td><Badge tone={v.type === "قبض" ? "success" : "warning"}>{v.type}</Badge></Td>
                    <Td>{v.personName}</Td>
                    <Td className="font-semibold">{currency(v.amount)}</Td>
                    <Td className="text-muted">{v.method}</Td>
                    <Td className="text-muted">{v.date}</Td>
                    <Td>
                      <Link href={`/vouchers/${v.id}/print`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
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
              <CardTitle>سند جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vtype">النوع</Label>
                  <Select id="vtype" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as VoucherType }))}>
                    {VOUCHER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vname">{form.type === "قبض" ? "اسم المستلم منه" : "اسم المستفيد"}</Label>
                  <Input id="vname" value={form.personName} onChange={(e) => setForm((f) => ({ ...f, personName: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="vamount">المبلغ (﷼)</Label>
                  <Input id="vamount" type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="vmethod">طريقة الاستلام</Label>
                  <Select id="vmethod" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as VoucherMethod }))}>
                    {VOUCHER_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vdate">التاريخ</Label>
                  <Input id="vdate" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="vpaymentnumber">رقم الدفعة (اختياري)</Label>
                  <Input id="vpaymentnumber" value={form.paymentNumber} onChange={(e) => setForm((f) => ({ ...f, paymentNumber: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="vperiodfrom">الفترة من</Label>
                  <Input id="vperiodfrom" type="date" value={form.periodFrom} onChange={(e) => setForm((f) => ({ ...f, periodFrom: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="vperiodto">الفترة إلى</Label>
                  <Input id="vperiodto" type="date" value={form.periodTo} onChange={(e) => setForm((f) => ({ ...f, periodTo: e.target.value }))} />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="vstatement">البيان</Label>
                  <Input id="vstatement" value={form.statement} onChange={(e) => setForm((f) => ({ ...f, statement: e.target.value }))} placeholder="سبب القبض/الصرف" />
                </div>
                <Button type="submit" disabled={submitting} className="sm:col-span-3 self-start">
                  {submitting ? "جارِ الحفظ..." : "حفظ السند"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

export default function AdminVouchersPage() {
  return (
    <Suspense fallback={null}>
      <VouchersPageInner />
    </Suspense>
  );
}
