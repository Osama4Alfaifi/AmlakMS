"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { OwnerScopeBanner } from "@/components/accountant/OwnerScopeBanner";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { currency } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { downloadExcel } from "@/lib/excel";
import { contractDisplayNumber } from "@/lib/contracts/display";
import { generatePaymentSchedule } from "@/lib/contracts/schedule";
import { useOwnerContracts, useOwnerProperties, useOwners, useTenants } from "@/lib/firestore/hooks";
import { createContract, createTenant, updateContractPayments, updateTenantContract } from "@/lib/firestore/mutations";
import { parseEjarPdf } from "@/lib/rega/parseEjarContract";
import type { ContractPayment, PaymentCycle } from "@/lib/types";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Plus,
  Receipt,
  Search,
  Upload,
} from "lucide-react";

const PAYMENT_CYCLES: PaymentCycle[] = ["شهري", "ربع سنوي", "نصف سنوي", "سنوي"];
const today = () => new Date().toISOString().slice(0, 10);

function emptyForm() {
  return {
    type: "إيجار" as "إيجار" | "بيع",
    propertyId: "",
    tenantMode: "existing" as "existing" | "new",
    tenantId: "",
    newTenantName: "",
    newTenantPhone: "",
    newTenantEmail: "",
    value: "",
    signedAt: today(),
    startDate: today(),
    endDate: "",
    paymentCycle: "سنوي" as PaymentCycle,
    documentUrl: "",
    externalContractNo: "",
  };
}

export default function AdminContractsPage() {
  const scope = useAccountantOwnerScope();
  const { data: contracts } = useOwnerContracts(scope.queryOwnerId);
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("الكل");
  const statuses = ["الكل", "نشط", "منتهي", "قيد التجديد"];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [importedPayments, setImportedPayments] = useState<ContractPayment[] | null>(null);

  const propertyTitleById = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties]);
  const tenantNameById = useMemo(() => new Map(tenants.map((t) => [t.id, t.name])), [tenants]);

  const enriched = useMemo(
    () =>
      contracts.map((c) => ({
        contract: c,
        propertyTitle: propertyTitleById.get(c.propertyId) ?? "",
        ownerName: owners.find((o) => o.id === c.ownerId)?.name ?? "",
        tenantName: tenantNameById.get(c.tenantId) ?? "",
      })),
    [contracts, propertyTitleById, owners, tenantNameById]
  );

  const filtered = useMemo(
    () =>
      enriched.filter(
        ({ contract: c, propertyTitle, ownerName, tenantName }) =>
          (status === "الكل" || c.status === status) &&
          (c.id.includes(query) || propertyTitle.includes(query) || ownerName.includes(query) || tenantName.includes(query))
      ),
    [enriched, query, status]
  );

  const exportRows = () =>
    filtered.map(({ contract: c, propertyTitle, ownerName, tenantName }) => ({
      "رقم العقد": contractDisplayNumber(c),
      العقار: propertyTitle,
      المالك: ownerName,
      المستأجر: tenantName,
      النوع: c.type,
      القيمة: c.value,
      البداية: c.startDate,
      النهاية: c.endDate,
      الحالة: c.status,
    }));

  const previewSchedule: ContractPayment[] =
    importedPayments ??
    (form.startDate && form.endDate && Number(form.value) > 0
      ? generatePaymentSchedule(form.startDate, form.endDate, Number(form.value), form.paymentCycle)
      : []);

  // Clears a stale imported schedule once the accountant edits a field it
  // was computed from — it stays valid across edits to unrelated fields
  // (tenant, document link, etc).
  function clearImportedScheduleOnEdit() {
    setImportedPayments(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportNotice(null);
    const parsed = await parseEjarPdf(file);
    setImporting(false);

    if (!parsed) {
      setImportNotice({ tone: "danger", text: "تعذّر الاستخراج من هذا الملف — يرجى تعبئة بيانات العقد يدويًا." });
      return;
    }

    const matchedTenant = parsed.tenantPhone ? tenants.find((t) => t.phone === parsed.tenantPhone) : undefined;

    setForm((f) => ({
      ...f,
      signedAt: parsed.signedAt ?? f.signedAt,
      startDate: parsed.startDate ?? f.startDate,
      endDate: parsed.endDate ?? f.endDate,
      value: parsed.totalValue != null ? String(parsed.totalValue) : f.value,
      paymentCycle: parsed.paymentCycle ?? f.paymentCycle,
      externalContractNo: parsed.externalContractNo ?? f.externalContractNo,
      tenantMode: matchedTenant ? "existing" : "new",
      tenantId: matchedTenant?.id ?? f.tenantId,
      newTenantName: matchedTenant ? f.newTenantName : parsed.tenantName ?? f.newTenantName,
      newTenantPhone: matchedTenant ? f.newTenantPhone : parsed.tenantPhone ?? f.newTenantPhone,
      newTenantEmail: matchedTenant ? f.newTenantEmail : parsed.tenantEmail ?? f.newTenantEmail,
    }));
    setImportedPayments(parsed.payments ?? null);
    setImportNotice({ tone: "success", text: "تم الاستخراج تلقائيًا من ملف إيجار — يرجى مراجعة الحقول قبل الحفظ." });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const property = properties.find((p) => p.id === form.propertyId);
    if (!property || !form.endDate || !Number(form.value)) return;
    if (form.tenantMode === "existing" && !form.tenantId) return;
    if (form.tenantMode === "new" && !form.newTenantName.trim()) return;

    setSubmitting(true);
    let tenantId = form.tenantId;
    if (form.tenantMode === "new") {
      tenantId = await createTenant({
        name: form.newTenantName,
        phone: form.newTenantPhone,
        email: form.newTenantEmail,
        propertyId: property.id,
        contractId: "",
      });
    }

    const contractId = await createContract(
      {
        propertyId: property.id,
        ownerId: property.ownerId,
        tenantId,
        type: form.type,
        signedAt: form.signedAt || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        value: Number(form.value),
        paymentCycle: form.paymentCycle,
        status: "نشط",
        documentUrl: form.documentUrl || undefined,
        externalContractNo: form.externalContractNo || undefined,
      },
      importedPayments ?? undefined
    );

    if (form.tenantMode === "new") {
      await updateTenantContract(tenantId, contractId);
    }

    setSubmitting(false);
    setShowForm(false);
    setForm(emptyForm());
    setImportedPayments(null);
    setImportNotice(null);
  }

  async function handleSettlePayment(contractId: string, payments: ContractPayment[], paymentId: string) {
    const updated = payments.map((p) => (p.id === paymentId ? { ...p, status: "مسددة" as const, paidAt: today() } : p));
    const settled = updated.find((p) => p.id === paymentId)!;
    await updateContractPayments(contractId, updated, `دفعة مسددة بقيمة ${settled.amount.toLocaleString("ar-SA")} ﷼`);
  }

  return (
    <DashboardShell allow={["admin", "accountant"]} title="العقود">
      <div className="flex flex-col gap-6">
        <OwnerScopeBanner scope={scope} />
        <Card>
          <CardHeader>
            <div>
              <CardTitle>جميع العقود</CardTitle>
              <CardSubtitle>{filtered.length} من {contracts.length} عقد — اضغط على أي صف لعرض جدول الدفعات</CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <div className="relative w-52">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadCsv("العقود", exportRows())}>
                <Download size={15} /> تصدير CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadExcel("العقود", "العقود", exportRows())}>
                <FileSpreadsheet size={15} /> تصدير Excel
              </Button>
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> عقد جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th></Th>
                  <Th>رقم العقد</Th>
                  <Th>العقار</Th>
                  <Th>المالك</Th>
                  <Th>المستأجر</Th>
                  <Th>النوع</Th>
                  <Th>القيمة</Th>
                  <Th>البداية</Th>
                  <Th>النهاية</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map(({ contract: c, propertyTitle, ownerName, tenantName }) => {
                  const isOpen = expandedId === c.id;
                  return (
                    <Fragment key={c.id}>
                      <Tr className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : c.id)}>
                        <Td className="w-8 text-muted">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Td>
                        <Td className="font-semibold text-brand-700">
                          <span className="inline-flex items-center gap-1.5">
                            {contractDisplayNumber(c)}
                            {c.documentUrl && (
                              <a
                                href={c.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(ev) => ev.stopPropagation()}
                                title="عرض نسخة العقد"
                                className="text-muted hover:text-brand-700"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </span>
                        </Td>
                        <Td className="max-w-[180px] truncate">{propertyTitle}</Td>
                        <Td className="text-muted">{ownerName}</Td>
                        <Td className="text-muted">{tenantName || "—"}</Td>
                        <Td>{c.type}</Td>
                        <Td className="font-semibold">{currency(c.value)}</Td>
                        <Td className="text-muted">{c.startDate}</Td>
                        <Td className="text-muted">{c.endDate}</Td>
                        <Td><Badge>{c.status}</Badge></Td>
                      </Tr>
                      {isOpen && (
                        <Tr className="bg-background">
                          <Td colSpan={10} className="py-4 whitespace-normal align-top">
                            <div className="pr-8 flex flex-col gap-4">
                              <div>
                                <p className="text-xs font-semibold text-muted mb-2">جدول الدفعات ({(c.payments ?? []).length})</p>
                                <table className="w-full text-sm max-w-lg">
                                  <thead>
                                    <tr className="text-xs text-muted border-b border-border">
                                      <th className="text-right font-semibold py-1.5">تاريخ الاستحقاق</th>
                                      <th className="text-right font-semibold py-1.5">المبلغ</th>
                                      <th className="text-right font-semibold py-1.5">الحالة</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(c.payments ?? []).map((p) => (
                                      <tr key={p.id} className="border-b border-border/60">
                                        <td className="py-1.5 text-muted">{p.dueDate}</td>
                                        <td className="py-1.5 font-medium">{currency(p.amount)}</td>
                                        <td className="py-1.5"><Badge>{p.status}</Badge></td>
                                        <td className="py-1.5">
                                          {p.status === "مستحقة" ? (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => {
                                                  if (confirm(`هل تريد تأكيد تسديد دفعة بقيمة ${p.amount.toLocaleString("ar-SA")} ﷼؟`)) {
                                                    handleSettlePayment(c.id, c.payments, p.id);
                                                  }
                                                }}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                                              >
                                                <CheckCircle2 size={13} /> تسديد
                                              </button>
                                            </div>
                                          ) : (
                                            <Link
                                              href={`/admin/vouchers?type=${encodeURIComponent("قبض")}&personName=${encodeURIComponent(tenantName)}&amount=${p.amount}&contractId=${c.id}&contractLabel=${encodeURIComponent(contractDisplayNumber(c))}`}
                                              className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand-700"
                                            >
                                              <Receipt size={13} /> إصدار سند قبض
                                            </Link>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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
              <CardTitle>عقد جديد</CardTitle>
              <CardSubtitle>سيُولَّد جدول الدفعات تلقائيًا حسب المدة ودورة الدفع</CardSubtitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 self-start rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted hover:text-brand-700 hover:border-brand-300 cursor-pointer">
                    <Upload size={14} />
                    {importing ? "جارِ الاستخراج..." : "استيراد من ملف عقد إيجار (Ejar/REGA)"}
                    <input type="file" accept="application/pdf" className="hidden" disabled={importing} onChange={handleFileUpload} />
                  </label>
                  {importNotice && (
                    <p className={`text-xs font-semibold ${importNotice.tone === "success" ? "text-success-600" : "text-danger-500"}`}>
                      {importNotice.text}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="ctype">نوع العقد</Label>
                    <Select id="ctype" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "إيجار" | "بيع" }))}>
                      <option value="إيجار">إيجار</option>
                      <option value="بيع">بيع</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cproperty">العقار</Label>
                    <Select id="cproperty" value={form.propertyId} onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))} required>
                      <option value="" disabled>اختر عقارًا</option>
                      {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cvalue">القيمة (﷼)</Label>
                    <Input
                      id="cvalue"
                      type="number"
                      min={0}
                      value={form.value}
                      onChange={(e) => {
                        clearImportedScheduleOnEdit();
                        setForm((f) => ({ ...f, value: e.target.value }));
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ccycle">دورة الدفع</Label>
                    <Select
                      id="ccycle"
                      value={form.paymentCycle}
                      onChange={(e) => {
                        clearImportedScheduleOnEdit();
                        setForm((f) => ({ ...f, paymentCycle: e.target.value as PaymentCycle }));
                      }}
                    >
                      {PAYMENT_CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Label className="mb-0">المستأجر</Label>
                    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                      <button type="button" onClick={() => setForm((f) => ({ ...f, tenantMode: "existing" }))} className={`px-3 py-1.5 font-semibold ${form.tenantMode === "existing" ? "bg-brand-600 text-white" : "text-muted"}`}>
                        مستأجر موجود
                      </button>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, tenantMode: "new" }))} className={`px-3 py-1.5 font-semibold ${form.tenantMode === "new" ? "bg-brand-600 text-white" : "text-muted"}`}>
                        مستأجر جديد
                      </button>
                    </div>
                  </div>
                  {form.tenantMode === "existing" ? (
                    <Select value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))} required>
                      <option value="" disabled>اختر مستأجرًا</option>
                      {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                  ) : (
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Input placeholder="اسم المستأجر" value={form.newTenantName} onChange={(e) => setForm((f) => ({ ...f, newTenantName: e.target.value }))} required />
                      <Input placeholder="الجوال" value={form.newTenantPhone} onChange={(e) => setForm((f) => ({ ...f, newTenantPhone: e.target.value }))} />
                      <Input placeholder="البريد الإلكتروني" type="email" value={form.newTenantEmail} onChange={(e) => setForm((f) => ({ ...f, newTenantEmail: e.target.value }))} />
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="csigned">تاريخ إبرام العقد</Label>
                    <Input id="csigned" type="date" value={form.signedAt} onChange={(e) => setForm((f) => ({ ...f, signedAt: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="cstart">تاريخ بداية العقد</Label>
                    <Input
                      id="cstart"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => {
                        clearImportedScheduleOnEdit();
                        setForm((f) => ({ ...f, startDate: e.target.value }));
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cend">تاريخ نهاية العقد</Label>
                    <Input
                      id="cend"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => {
                        clearImportedScheduleOnEdit();
                        setForm((f) => ({ ...f, endDate: e.target.value }));
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cdoc">رابط نسخة العقد (اختياري)</Label>
                  <Input id="cdoc" type="url" dir="ltr" placeholder="https://" value={form.documentUrl} onChange={(e) => setForm((f) => ({ ...f, documentUrl: e.target.value }))} />
                </div>

                {previewSchedule.length > 0 && (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">
                    <p className="font-semibold text-brand-700 mb-2">
                      {importedPayments
                        ? `جدول الدفعات المستخرَج من الملف (${previewSchedule.length} ${previewSchedule.length === 1 ? "دفعة" : "دفعات"}):`
                        : `سيتم إنشاء ${previewSchedule.length} ${previewSchedule.length === 1 ? "دفعة" : "دفعات"} تلقائيًا:`}
                    </p>
                    <ul className="flex flex-col gap-1 text-xs text-muted">
                      {previewSchedule.map((p) => (
                        <li key={p.id}>{p.dueDate} — {currency(p.amount)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="self-start">
                  {submitting ? "جارِ الحفظ..." : "حفظ العقد"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
