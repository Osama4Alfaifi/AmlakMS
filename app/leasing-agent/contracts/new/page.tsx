"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, FileText, Upload } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { CheckIcon } from "@/components/ui/icons";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { currency } from "@/lib/mock-data";
import { computeEndDateFromDuration, generatePaymentSchedule } from "@/lib/contracts/schedule";
import { useOwnerProperties, useOwnerUnits, useOwners, useTenants } from "@/lib/firestore/hooks";
import { createContract, createTenant, updateTenantContract } from "@/lib/firestore/mutations";
import { parseEjarPdf } from "@/lib/rega/parseEjarContract";
import type { ContractPayment, PaymentCycle } from "@/lib/types";

type Usage = "سكني" | "تجاري";

const PAYMENT_CYCLES: PaymentCycle[] = ["شهري", "ربع سنوي", "نصف سنوي", "سنوي"];
const STEPS = ["نوع العقد", "العقار والوحدة", "المستأجر", "بنود العقد", "المراجعة"];
const today = () => new Date().toISOString().slice(0, 10);

// Soft classification used only to put the matching properties first and to
// offer sensible defaults; nothing is hidden, since a property can be mixed use.
const COMMERCIAL_PROPERTY = ["محل تجاري", "مكتب", "مجمع تجاري مفتوح", "مجمع تجاري مغلق", "برج"];
const COMMERCIAL_UNIT = ["كشك", "محل", "ورشة", "مكتب", "مستودع", "معرض", "صراف", "سينما", "محطة"];

const emptyForm = () => ({
  propertyId: "",
  unitId: "",
  tenantMode: "new" as "existing" | "new",
  tenantId: "",
  tenantName: "",
  tenantPhone: "",
  tenantIdNumber: "",
  tenantBirthDate: "",
  tenantSecondaryPhone: "",
  tenantEmployer: "",
  tenantIdExpiryDate: "",
  signedAt: today(),
  startDate: today(),
  endDate: "",
  value: "",
  paymentCycle: "سنوي" as PaymentCycle,
  paymentDay: "",
  graceMonths: "",
  waterFee: "",
  electricityFee: "",
  externalContractNo: "",
  documentUrl: "",
});

export default function NewLeasePage() {
  const t = useT();
  const scope = useAccountantOwnerScope();
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: units } = useOwnerUnits(scope.queryOwnerId);
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();

  const [step, setStep] = useState(0);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [duration, setDuration] = useState({ years: "", months: "", days: "" });
  const [importedPayments, setImportedPayments] = useState<ContractPayment[] | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) => {
    setError(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const property = properties.find((p) => p.id === form.propertyId);
  const propertyUnits = useMemo(() => units.filter((u) => u.propertyId === form.propertyId), [units, form.propertyId]);
  const unit = propertyUnits.find((u) => u.id === form.unitId);
  const owner = owners.find((o) => o.id === property?.ownerId);
  const existingTenant = tenants.find((x) => x.id === form.tenantId);

  const matches = (p: (typeof properties)[number]) => {
    const commercial =
      COMMERCIAL_PROPERTY.includes(p.type) || units.some((u) => u.propertyId === p.id && COMMERCIAL_UNIT.includes(u.type));
    return usage === "تجاري" ? commercial : !COMMERCIAL_PROPERTY.includes(p.type) || p.type === "أرض";
  };
  const sortedProperties = useMemo(() => {
    const ok = properties.filter(matches);
    const rest = properties.filter((p) => !ok.includes(p));
    return [...ok, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, units, usage]);

  const schedule: ContractPayment[] =
    importedPayments ??
    (form.startDate && form.endDate && Number(form.value) > 0
      ? generatePaymentSchedule(
          form.startDate,
          form.endDate,
          Number(form.value),
          form.paymentCycle,
          Number(form.paymentDay) || undefined,
          Number(form.graceMonths) || undefined
        )
      : []);

  function updateDuration(patch: Partial<typeof duration>) {
    const next = { ...duration, ...patch };
    setDuration(next);
    const y = Number(next.years) || 0;
    const m = Number(next.months) || 0;
    const d = Number(next.days) || 0;
    if (!form.startDate || (y === 0 && m === 0 && d === 0)) return;
    setImportedPayments(null);
    setForm((f) => ({ ...f, endDate: computeEndDateFromDuration(f.startDate, y, m, d) }));
  }

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setNotice(null);
    const parsed = await parseEjarPdf(file);
    if (!parsed) {
      setNotice({ tone: "danger", text: "تعذّر الاستخراج من هذا الملف — يمكنك تعبئة البيانات يدويًا." });
      return;
    }
    const matched = parsed.tenantPhone ? tenants.find((x) => x.phone === parsed.tenantPhone) : undefined;
    setForm((f) => ({
      ...f,
      signedAt: parsed.signedAt ?? f.signedAt,
      startDate: parsed.startDate ?? f.startDate,
      endDate: parsed.endDate ?? f.endDate,
      value: parsed.totalValue != null ? String(parsed.totalValue) : f.value,
      paymentCycle: parsed.paymentCycle ?? f.paymentCycle,
      externalContractNo: parsed.externalContractNo ?? f.externalContractNo,
      tenantMode: matched ? "existing" : "new",
      tenantId: matched?.id ?? f.tenantId,
      tenantName: matched ? f.tenantName : parsed.tenantName ?? f.tenantName,
      tenantPhone: matched ? f.tenantPhone : parsed.tenantPhone ?? f.tenantPhone,
      tenantIdNumber: matched ? f.tenantIdNumber : parsed.tenantIdNumber ?? f.tenantIdNumber,
    }));
    setImportedPayments(parsed.payments ?? null);
    setNotice({ tone: "success", text: "تم استخراج بيانات العقد من ملف إيجار. أكمل الخطوات وراجعها قبل الحفظ." });
    if (!usage) setUsage("سكني");
  }

  function validate(s: number): string | null {
    if (s === 0 && !usage) return "اختر نوع العقد أولًا";
    if (s === 1) {
      if (!property) return "اختر العقار";
      if (propertyUnits.length > 0 && !unit) return "اختر الوحدة المراد تأجيرها";
    }
    if (s === 2) {
      if (form.tenantMode === "existing" && !form.tenantId) return "اختر المستأجر";
      if (form.tenantMode === "new" && (!form.tenantName.trim() || !form.tenantPhone.trim())) return "أدخل اسم المستأجر ورقم جواله";
    }
    if (s === 3) {
      if (!form.startDate || !form.endDate) return "حدد تاريخ بداية العقد ونهايته";
      if (form.endDate <= form.startDate) return "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
      if (!(Number(form.value) > 0)) return "أدخل قيمة الإيجار";
    }
    return null;
  }

  function next() {
    const msg = validate(step);
    if (msg) return setError(msg);
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    for (let s = 0; s < STEPS.length - 1; s++) {
      const msg = validate(s);
      if (msg) {
        setStep(s);
        return setError(msg);
      }
    }
    if (!property || !usage) return;
    setSubmitting(true);
    try {
      let tenantId = form.tenantId;
      if (form.tenantMode === "new") {
        tenantId = await createTenant({
          name: form.tenantName,
          phone: form.tenantPhone,
          idNumber: form.tenantIdNumber || undefined,
          birthDate: form.tenantBirthDate || undefined,
          secondaryPhone: form.tenantSecondaryPhone || undefined,
          employer: form.tenantEmployer || undefined,
          idExpiryDate: form.tenantIdExpiryDate || undefined,
          propertyId: property.id,
          unitId: form.unitId || undefined,
          contractId: "",
        });
      }
      const id = await createContract(
        {
          propertyId: property.id,
          unitId: form.unitId || undefined,
          ownerId: property.ownerId,
          tenantId,
          type: "إيجار",
          usage,
          signedAt: form.signedAt || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          value: Number(form.value),
          paymentCycle: form.paymentCycle,
          paymentDay: Number(form.paymentDay) || undefined,
          graceMonths: Number(form.graceMonths) || undefined,
          waterFee: Number(form.waterFee) || undefined,
          electricityFee: Number(form.electricityFee) || undefined,
          status: "نشط",
          documentUrl: form.documentUrl || undefined,
          externalContractNo: form.externalContractNo || undefined,
        },
        importedPayments ?? undefined
      );
      if (form.tenantMode === "new") await updateTenantContract(tenantId, id);
      setCreatedId(id);
    } catch {
      setError("تعذّر حفظ العقد. تحقق من الصلاحيات وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0);
    setUsage(null);
    setForm(emptyForm());
    setDuration({ years: "", months: "", days: "" });
    setImportedPayments(null);
    setNotice(null);
    setError(null);
    setCreatedId(null);
  }

  if (createdId) {
    return (
      <DashboardShell allow={["leasingAgent", "admin"]} title={t("عقد إيجار جديد")}>
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-4 py-10">
            <span className="h-14 w-14 rounded-full bg-success-50 text-success-700 grid place-items-center">
              <CheckIcon width={28} height={28} strokeWidth={2.25} />
            </span>
            <h2 className="text-xl font-extrabold">{t("تم إنشاء عقد الإيجار")}</h2>
            <p className="text-muted max-w-md">
              {t("حُفظ العقد وجدول دفعاته، ويظهر الآن في قائمة العقود.")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/admin/contracts">
                <Button>{t("عرض العقود")}</Button>
              </Link>
              <Button variant="outline" onClick={reset}>
                {t("عقد إيجار آخر")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const field = "flex flex-col";

  return (
    <DashboardShell allow={["leasingAgent", "admin"]} title={t("عقد إيجار جديد")}>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>عقد إيجار جديد</CardTitle>
            <CardSubtitle>أنشئ عقد الإيجار خطوة بخطوة، وسيُحفظ مع جدول دفعاته.</CardSubtitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label={t("خطوات إنشاء العقد")}>
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-7 w-7 rounded-full grid place-items-center text-xs font-bold num",
                    i < step ? "bg-success-50 text-success-700" : i === step ? "bg-primary text-on-primary" : "bg-surface-sunken text-muted"
                  )}
                  aria-current={i === step ? "step" : undefined}
                >
                  {i < step ? <CheckIcon width={14} height={14} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className={cn("text-sm font-semibold", i === step ? "text-foreground" : "text-muted")}>{t(label)}</span>
                {i < STEPS.length - 1 && <span className="w-4 h-px bg-border-strong hidden sm:block" />}
              </li>
            ))}
          </ol>

          {notice && (
            <p
              role="status"
              className={cn(
                "rounded-xl px-3.5 py-2.5 text-sm font-semibold",
                notice.tone === "success" ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"
              )}
            >
              {t(notice.text)}
            </p>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">{t("اختر نوع عقد الإيجار")}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    { key: "سكني", title: "إيجار سكني", desc: "شقق وفلل ودور وغرف للسكن.", icon: Building2 },
                    { key: "تجاري", title: "إيجار تجاري", desc: "محلات ومكاتب ومعارض ومستودعات.", icon: FileText },
                  ] as const
                ).map((o) => {
                  const Icon = o.icon;
                  const active = usage === o.key;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        setUsage(o.key);
                        setError(null);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "pressable text-start rounded-2xl p-5 flex items-start gap-4 min-h-28",
                        active ? "bg-primary text-on-primary shadow-raised" : "bg-surface-sunken/60 hover:bg-surface-sunken"
                      )}
                    >
                      <span className={cn("h-12 w-12 shrink-0 rounded-xl grid place-items-center", active ? "bg-white/15" : "bg-brand-100 text-brand-700")}>
                        <Icon size={24} strokeWidth={1.75} />
                      </span>
                      <span>
                        <span className="block text-lg font-bold">{t(o.title)}</span>
                        <span className={cn("block text-sm mt-1", active ? "text-white/85" : "text-muted")}>{t(o.desc)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <label className="pressable cursor-pointer rounded-2xl border-2 border-dashed border-border-strong p-4 flex items-center gap-3 hover:bg-surface-sunken/60">
                <Upload size={20} className="text-brand-700 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-semibold">{t("لديك ملف عقد من إيجار؟")}</span>
                  <span className="block text-xs text-muted">{t("ارفع ملف PDF لتعبئة بيانات العقد تلقائيًا، ثم راجعها.")}</span>
                </span>
                <input type="file" accept="application/pdf" className="hidden" onChange={importFile} />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={field}>
                <Label htmlFor="property">العقار</Label>
                <Select
                  id="property"
                  value={form.propertyId}
                  onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value, unitId: "" }))}
                >
                  <option value="">{t("اختر العقار")}</option>
                  {sortedProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.city}
                    </option>
                  ))}
                </Select>
              </div>
              {propertyUnits.length > 0 && (
                <div className={field}>
                  <Label htmlFor="unit">الوحدة</Label>
                  <Select id="unit" value={form.unitId} onChange={(e) => set("unitId", e.target.value)}>
                    <option value="">{t("اختر الوحدة")}</option>
                    {propertyUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} — {u.type} {u.status !== "متاحة" ? `(${u.status})` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {property && (
                <p className="sm:col-span-2 text-sm text-muted">
                  {t("المالك")}: <span className="font-semibold text-foreground">{owner?.name ?? "—"}</span> · {property.city} · {property.district}
                  {propertyUnits.length === 0 && ` · ${t("وحدة واحدة")}`}
                </p>
              )}
              {properties.length === 0 && <p className="sm:col-span-2 text-sm text-warning-700">{t("لا توجد عقارات مرتبطة بحسابك بعد.")}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="inline-flex rounded-xl bg-surface-sunken p-1 w-fit text-sm font-semibold">
                {(["new", "existing"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set("tenantMode", m)}
                    className={cn("pressable px-4 min-h-10 rounded-lg", form.tenantMode === m ? "bg-surface shadow-control" : "text-muted")}
                  >
                    {m === "new" ? t("مستأجر جديد") : t("مستأجر موجود")}
                  </button>
                ))}
              </div>
              {form.tenantMode === "existing" ? (
                <div className={cn(field, "max-w-md")}>
                  <Label htmlFor="tenant">المستأجر</Label>
                  <Select id="tenant" value={form.tenantId} onChange={(e) => set("tenantId", e.target.value)}>
                    <option value="">{t("اختر المستأجر")}</option>
                    {tenants.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} — {x.phone}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={field}>
                    <Label htmlFor="tname">اسم المستأجر</Label>
                    <Input id="tname" value={form.tenantName} onChange={(e) => set("tenantName", e.target.value)} />
                  </div>
                  <div className={field}>
                    <Label htmlFor="tphone">رقم الجوال</Label>
                    <Input id="tphone" inputMode="tel" dir="ltr" value={form.tenantPhone} onChange={(e) => set("tenantPhone", e.target.value)} />
                  </div>
                  <div className={field}>
                    <Label htmlFor="tid">رقم الهوية / الإقامة</Label>
                    <Input id="tid" inputMode="numeric" dir="ltr" value={form.tenantIdNumber} onChange={(e) => set("tenantIdNumber", e.target.value)} />
                  </div>
                  <div className={field}>
                    <Label htmlFor="tidexp">تاريخ انتهاء الهوية</Label>
                    <Input id="tidexp" type="date" value={form.tenantIdExpiryDate} onChange={(e) => set("tenantIdExpiryDate", e.target.value)} />
                  </div>
                  <div className={field}>
                    <Label htmlFor="tbirth">تاريخ الميلاد</Label>
                    <Input id="tbirth" type="date" value={form.tenantBirthDate} onChange={(e) => set("tenantBirthDate", e.target.value)} />
                  </div>
                  <div className={field}>
                    <Label htmlFor="tphone2">جوال آخر</Label>
                    <Input id="tphone2" inputMode="tel" dir="ltr" value={form.tenantSecondaryPhone} onChange={(e) => set("tenantSecondaryPhone", e.target.value)} />
                  </div>
                  <div className={cn(field, "sm:col-span-2")}>
                    <Label htmlFor="temp">جهة العمل</Label>
                    <Input id="temp" value={form.tenantEmployer} onChange={(e) => set("tenantEmployer", e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className={field}>
                  <Label htmlFor="signed">تاريخ إبرام العقد</Label>
                  <Input id="signed" type="date" value={form.signedAt} onChange={(e) => set("signedAt", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="start">بداية العقد</Label>
                  <Input
                    id="start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => {
                      setImportedPayments(null);
                      set("startDate", e.target.value);
                    }}
                  />
                </div>
                <div className={field}>
                  <Label htmlFor="end">نهاية العقد</Label>
                  <Input
                    id="end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => {
                      setImportedPayments(null);
                      set("endDate", e.target.value);
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/70 mb-1.5">{t("أو احسب النهاية من مدة العقد")}</p>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {(["years", "months", "days"] as const).map((k) => (
                    <div key={k} className={field}>
                      <Label htmlFor={`d-${k}`}>{k === "years" ? "سنوات" : k === "months" ? "أشهر" : "أيام"}</Label>
                      <Input id={`d-${k}`} type="number" min="0" inputMode="numeric" value={duration[k]} onChange={(e) => updateDuration({ [k]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className={field}>
                  <Label htmlFor="value">قيمة الإيجار (إجمالي العقد)</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={form.value}
                    onChange={(e) => {
                      setImportedPayments(null);
                      set("value", e.target.value);
                    }}
                  />
                </div>
                <div className={field}>
                  <Label htmlFor="cycle">دورة الدفع</Label>
                  <Select
                    id="cycle"
                    value={form.paymentCycle}
                    onChange={(e) => {
                      setImportedPayments(null);
                      set("paymentCycle", e.target.value as PaymentCycle);
                    }}
                  >
                    {PAYMENT_CYCLES.map((c) => (
                      <option key={c} value={c}>
                        {t(c)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className={field}>
                  <Label htmlFor="payday">يوم الاستحقاق من الشهر</Label>
                  <Input id="payday" type="number" min="1" max="31" inputMode="numeric" value={form.paymentDay} onChange={(e) => set("paymentDay", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="grace">أشهر السماح</Label>
                  <Input id="grace" type="number" min="0" inputMode="numeric" value={form.graceMonths} onChange={(e) => set("graceMonths", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="water">رسوم المياه الشهرية</Label>
                  <Input id="water" type="number" min="0" inputMode="decimal" value={form.waterFee} onChange={(e) => set("waterFee", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="elec">رسوم الكهرباء الشهرية</Label>
                  <Input id="elec" type="number" min="0" inputMode="decimal" value={form.electricityFee} onChange={(e) => set("electricityFee", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="ejar">رقم العقد في إيجار</Label>
                  <Input id="ejar" dir="ltr" value={form.externalContractNo} onChange={(e) => set("externalContractNo", e.target.value)} />
                </div>
                <div className={cn(field, "sm:col-span-2")}>
                  <Label htmlFor="docurl">رابط نسخة العقد</Label>
                  <Input id="docurl" type="url" dir="ltr" placeholder="https://" value={form.documentUrl} onChange={(e) => set("documentUrl", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && property && (
            <div className="flex flex-col gap-5">
              <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <Row label={t("نوع العقد")} value={usage ? t(usage === "سكني" ? "إيجار سكني" : "إيجار تجاري") : "—"} />
                <Row label={t("العقار")} value={property.title} />
                <Row label={t("الوحدة")} value={unit ? `${unit.unitNumber} — ${unit.type}` : t("العقار كاملًا (وحدة واحدة)")} />
                <Row label={t("المالك")} value={owner?.name ?? "—"} />
                <Row label={t("المستأجر")} value={form.tenantMode === "new" ? form.tenantName : existingTenant?.name ?? "—"} />
                <Row label={t("بداية العقد")} value={form.startDate} num />
                <Row label={t("ينتهي العقد")} value={form.endDate} num />
                <Row label={t("قيمة الإيجار")} value={currency(Number(form.value))} num />
                <Row label={t("دورة الدفع")} value={t(form.paymentCycle)} />
              </dl>
              <div>
                <p className="text-sm font-bold mb-2">
                  {t("جدول الدفعات")} <Badge tone="brand">{schedule.length}</Badge>
                </p>
                <ul className="max-h-60 overflow-y-auto divide-y divide-border rounded-xl bg-surface-sunken/60 px-3">
                  {schedule.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="num text-muted">{p.dueDate}</span>
                      <span className="num font-semibold">{currency(p.amount)}</span>
                    </li>
                  ))}
                  {schedule.length === 0 && <li className="py-3 text-sm text-muted">{t("أكمل بنود العقد لعرض الجدول.")}</li>}
                </ul>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-danger-50 text-danger-700 px-3.5 py-2.5 text-sm font-semibold">
              {t(error)}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="outline" onClick={() => (setError(null), setStep((s) => Math.max(0, s - 1)))} disabled={step === 0 || submitting}>
              {t("السابق")}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>{t("التالي")}</Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? t("جارِ الحفظ...") : t("إنشاء العقد")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function Row({ label, value, num }: { label: string; value: string; num?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("font-semibold", num && "num")}>{value}</dd>
    </div>
  );
}
