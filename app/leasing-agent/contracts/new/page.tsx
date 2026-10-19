"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Upload } from "lucide-react";
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
import { readAttachment, type AttachedFile } from "@/lib/files";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { reverseGeocode } from "@/lib/geocode";
import { SAUDI_REGIONS } from "@/lib/saudi-regions";
import { computeEndDateFromDuration, contractDuration, generatePaymentSchedule } from "@/lib/contracts/schedule";
import { useOwnerProperties, useOwnerUnits, useOwners, useTenants } from "@/lib/firestore/hooks";
import {
  createContract,
  createDocumentLink,
  createOwner,
  createProperty,
  createTenant,
  createUnit,
  updateOwner,
  updateProperty,
  updateTenantContract,
  updateUnit,
} from "@/lib/firestore/mutations";
import { parseEjarPdf } from "@/lib/rega/parseEjarContract";
import { UNIT_TYPES } from "@/lib/types";
import type { ContractPayment, MeterBilledTo, PaymentCycle, PropertyType } from "@/lib/types";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-muted text-sm">جارِ تحميل الخريطة...</div>,
});

type Usage = "سكني" | "تجاري";
type StepKey = "term" | "deed" | "owner" | "property" | "units" | "pick" | "tenant" | "rent" | "payments" | "review";

const STEP_LABEL: Record<StepKey, string> = {
  term: "مدة العقد",
  deed: "صك الملكية",
  owner: "المالك",
  property: "العقار",
  units: "الوحدات",
  pick: "العقار والوحدة",
  tenant: "المستأجر",
  rent: "القيمة والعدادات",
  payments: "الدفعات",
  review: "المراجعة",
};
const FLOW_NEW: StepKey[] = ["term", "deed", "owner", "property", "units", "tenant", "rent", "payments", "review"];
const FLOW_EXISTING: StepKey[] = ["term", "pick", "owner", "tenant", "rent", "payments", "review"];

const PROPERTY_TYPES: PropertyType[] = ["عمارة", "شقة", "فيلا", "دور", "روف", "أرض", "محل تجاري", "مكتب", "استراحة", "برج", "مجمع تجاري مفتوح", "مجمع تجاري مغلق", "غرفة عزاب", "أخرى"];
const DEED_TYPES = ["إلكتروني", "ورقي", "عقد إيجار", "سجل عقاري"] as const;
const METER_PAYERS: MeterBilledTo[] = ["المالك", "المستأجر"];
const MARKER_COLORS = ["#3b7ea8", "#1e9558", "#d4900e", "#d03a3a", "#2b7bd6", "#255d82"];
const CYCLES: { key: PaymentCycle; label: string; hint: string }[] = [
  { key: "دفعة واحدة", label: "دفعة واحدة", hint: "كامل مبلغ العقد في بدايته" },
  { key: "سنوي", label: "سنوي", hint: "دفعة في بداية كل سنة" },
  { key: "نصف سنوي", label: "نصف سنوي", hint: "كل 6 أشهر" },
  { key: "ثلث سنوي", label: "ثلث سنوي", hint: "3 دفعات في السنة" },
  { key: "ربع سنوي", label: "ربع سنوي", hint: "4 دفعات في السنة" },
];
const DEFAULT_LAT = 24.7136;
const DEFAULT_LNG = 46.6753;
const today = () => new Date().toISOString().slice(0, 10);

// Soft classification used only to put matching properties first.
const COMMERCIAL_PROPERTY = ["محل تجاري", "مكتب", "مجمع تجاري مفتوح", "مجمع تجاري مغلق", "برج"];

interface UnitDraft {
  unitNumber: string;
  type: string;
  floor: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
}
const emptyUnit = (n: number): UnitDraft => ({ unitNumber: String(n), type: "شقة", floor: "", area: "", bedrooms: "", bathrooms: "" });

const emptyForm = () => ({
  mode: "new" as "new" | "existing",
  usage: "سكني" as Usage,
  signedAt: today(),
  startDate: today(),
  endDate: "",
  // existing property
  propertyId: "",
  unitId: "",
  // deed
  pDeedType: "إلكتروني" as (typeof DEED_TYPES)[number],
  pDeedIssue: "",
  pDeedLink: "",
  // owner
  ownerMode: "existing" as "existing" | "new",
  ownerId: "",
  oName: "",
  oPhone: "",
  oEmail: "",
  oId: "",
  oBirth: "",
  oAbsher: "",
  // property
  pType: "عمارة" as PropertyType,
  pFloors: "",
  pTitle: "",
  pArea: "",
  pRegion: "",
  pCity: "",
  pDistrict: "",
  pStreet: "",
  pBuilding: "",
  pSub: "",
  pPostal: "",
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  // units
  unitCount: "0",
  leasedUnit: "0",
  // tenant
  tenantMode: "new" as "existing" | "new",
  tenantId: "",
  tName: "",
  tPhone: "",
  tId: "",
  tBirth: "",
  tAbsher: "",
  tIdExpiry: "",
  tPhone2: "",
  tEmployer: "",
  // rent + meters
  annualRent: "",
  elecNo: "",
  elecBy: "المستأجر" as MeterBilledTo,
  waterNo: "",
  waterBy: "المستأجر" as MeterBilledTo,
  gasNo: "",
  gasBy: "المستأجر" as MeterBilledTo,
  externalContractNo: "",
  documentUrl: "",
  // payments
  cycle: "سنوي" as PaymentCycle,
});

type Form = ReturnType<typeof emptyForm>;

const ymd = (s: string) => {
  const d = contractDuration(s.split("|")[0], s.split("|")[1]);
  return d;
};

export default function NewLeasePage() {
  const t = useT();
  const scope = useAccountantOwnerScope();
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: units } = useOwnerUnits(scope.queryOwnerId);
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();

  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm());
  const [deedFile, setDeedFile] = useState<AttachedFile | null>(null);
  const [dur, setDur] = useState({ y: "", m: "", d: "" });
  const [unitRows, setUnitRows] = useState<UnitDraft[]>([]);
  const [schedule, setSchedule] = useState<ContractPayment[]>([]);
  const [importedPayments, setImportedPayments] = useState<ContractPayment[] | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const flow = form.mode === "new" ? FLOW_NEW : FLOW_EXISTING;
  const step = flow[Math.min(stepIdx, flow.length - 1)];
  const isNew = form.mode === "new";

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setError(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const property = properties.find((p) => p.id === form.propertyId);
  const propertyUnits = useMemo(() => units.filter((u) => u.propertyId === form.propertyId), [units, form.propertyId]);
  const unit = propertyUnits.find((u) => u.id === form.unitId);
  const ownerIsNew = isNew && form.ownerMode === "new";
  const effectiveOwnerId = isNew ? (form.ownerMode === "existing" ? form.ownerId : "") : property?.ownerId ?? "";
  const owner = owners.find((o) => o.id === effectiveOwnerId);
  const existingTenant = tenants.find((x) => x.id === form.tenantId);
  const regionCities = SAUDI_REGIONS.find((r) => r.name === form.pRegion)?.cities ?? [];

  // Pre-fill the owner's details from their record whenever the owner changes.
  useEffect(() => {
    if (!owner) return;
    setForm((f) => ({
      ...f,
      oName: owner.name,
      oPhone: owner.phone,
      oEmail: owner.email ?? "",
      oId: owner.idNumber ?? "",
      oBirth: owner.birthDate ?? "",
      oAbsher: owner.absherPhone ?? "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner?.id]);

  // ---- contract term: start + end + duration stay in sync -------------------
  const durationParts = () => ({ y: Number(dur.y) || 0, m: Number(dur.m) || 0, d: Number(dur.d) || 0 });

  function onStart(v: string) {
    setImportedPayments(null);
    const { y, m, d } = durationParts();
    setError(null);
    setForm((f) => ({ ...f, startDate: v, endDate: v && (y || m || d) ? computeEndDateFromDuration(v, y, m, d) : f.endDate }));
    if (!(y || m || d) && v && form.endDate && form.endDate > v) {
      const c = ymd(`${v}|${form.endDate}`);
      setDur({ y: String(c.years), m: String(c.months), d: String(c.days) });
    }
  }
  function onEnd(v: string) {
    setImportedPayments(null);
    set("endDate", v);
    if (form.startDate && v && v > form.startDate) {
      const c = ymd(`${form.startDate}|${v}`);
      setDur({ y: String(c.years), m: String(c.months), d: String(c.days) });
    } else setDur({ y: "", m: "", d: "" });
  }
  function onDur(patch: Partial<typeof dur>) {
    setImportedPayments(null);
    const next = { ...dur, ...patch };
    setDur(next);
    const y = Number(next.y) || 0;
    const m = Number(next.m) || 0;
    const d = Number(next.d) || 0;
    if (form.startDate && (y || m || d)) set("endDate", computeEndDateFromDuration(form.startDate, y, m, d));
  }

  const termOk = !!form.startDate && !!form.endDate && form.endDate > form.startDate;
  const termDur = termOk ? contractDuration(form.startDate, form.endDate) : null;
  const termMonths = termDur ? termDur.years * 12 + termDur.months + termDur.days / 30 : 0;
  const annual = Number(form.annualRent) || 0;
  const contractTotal = Math.round((annual * termMonths) / 12);
  const durationText = termDur
    ? `${termDur.years} ${t("سنة")} ${termDur.months} ${t("شهر")} ${termDur.days} ${t("يوم")}`
    : "—";

  // ---- payment schedule: regenerated when its inputs change, then editable ---
  const scheduleKey = `${form.startDate}|${form.endDate}|${contractTotal}|${form.cycle}`;
  const lastKey = useRef("");
  useEffect(() => {
    if (lastKey.current === scheduleKey) return;
    lastKey.current = scheduleKey;
    if (importedPayments) {
      setSchedule(importedPayments);
      return;
    }
    setSchedule(termOk && contractTotal > 0 ? generatePaymentSchedule(form.startDate, form.endDate, contractTotal, form.cycle) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleKey]);
  const scheduleSum = schedule.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  function editPayment(i: number, patch: Partial<ContractPayment>) {
    setSchedule((rows) => rows.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  // ---- units ----------------------------------------------------------------
  function setUnitCount(v: string) {
    const n = Math.max(0, Math.min(60, Number(v) || 0));
    set("unitCount", v);
    setUnitRows((rows) => (n <= rows.length ? rows.slice(0, n) : [...rows, ...Array.from({ length: n - rows.length }, (_, i) => emptyUnit(rows.length + i + 1))]));
    if (Number(form.leasedUnit) >= n) set("leasedUnit", "0");
  }
  const editUnit = (i: number, patch: Partial<UnitDraft>) =>
    setUnitRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // ---- location --------------------------------------------------------------
  async function pickLocation(lat: number, lng: number) {
    setForm((f) => ({ ...f, lat, lng }));
    setGeoNote(t("جارِ جلب العنوان من الخريطة..."));
    const a = await reverseGeocode(lat, lng);
    if (!a) {
      setGeoNote(t("تعذّر جلب العنوان تلقائيًا. أكمل الحقول يدويًا."));
      return;
    }
    setForm((f) => ({
      ...f,
      pRegion: a.region ?? f.pRegion,
      pCity: a.city ?? f.pCity,
      pDistrict: a.district ?? f.pDistrict,
      pStreet: a.street ?? f.pStreet,
      pPostal: a.postalCode ?? f.pPostal,
      pBuilding: a.buildingNumber ?? f.pBuilding,
    }));
    setGeoNote(t("تمت تعبئة العنوان من الخريطة. راجعه وأكمل رقم المبنى والرمز الإضافي من العنوان الوطني."));
  }

  // ---- files ------------------------------------------------------------------
  async function attachDeed(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      setDeedFile(await readAttachment(file));
    } catch (err) {
      setDeedFile(null);
      setError(
        err instanceof Error && err.message === "unsupported"
          ? "ارفع صك الملكية بصيغة PDF أو صورة."
          : "حجم الملف كبير. الحد الأقصى 650 كيلوبايت، أو الصق رابط الصك بدلًا من ذلك."
      );
    }
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
    const start = parsed.startDate ?? form.startDate;
    const end = parsed.endDate ?? form.endDate;
    const months =
      start && end && end > start ? (() => { const c = contractDuration(start, end); return c.years * 12 + c.months + c.days / 30; })() : 0;
    setForm((f) => ({
      ...f,
      signedAt: parsed.signedAt ?? f.signedAt,
      startDate: start,
      endDate: end,
      annualRent: parsed.totalValue != null && months > 0 ? String(Math.round((parsed.totalValue * 12) / months)) : f.annualRent,
      cycle: parsed.paymentCycle && CYCLES.some((c) => c.key === parsed.paymentCycle) ? parsed.paymentCycle : f.cycle,
      externalContractNo: parsed.externalContractNo ?? f.externalContractNo,
      tenantMode: matched ? "existing" : "new",
      tenantId: matched?.id ?? f.tenantId,
      tName: matched ? f.tName : parsed.tenantName ?? f.tName,
      tPhone: matched ? f.tPhone : parsed.tenantPhone ?? f.tPhone,
      tId: matched ? f.tId : parsed.tenantIdNumber ?? f.tId,
    }));
    if (start && end && end > start) {
      const c = contractDuration(start, end);
      setDur({ y: String(c.years), m: String(c.months), d: String(c.days) });
    }
    setImportedPayments(parsed.payments ?? null);
    setNotice({ tone: "success", text: "تم استخراج بيانات العقد من ملف إيجار. أكمل الخطوات وراجعها قبل الحفظ." });
  }

  // ---- validation ---------------------------------------------------------------
  function validate(k: StepKey): string | null {
    switch (k) {
      case "term":
        if (!form.startDate) return "حدد تاريخ بداية العقد";
        if (!form.endDate) return "حدد تاريخ نهاية العقد أو مدته";
        if (form.endDate <= form.startDate) return "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
        return null;
      case "deed":
        return !deedFile && !form.pDeedLink.trim() ? "أرفق ملف صك الملكية أو ألصق رابطه" : null;
      case "pick":
        if (!property) return "اختر العقار";
        if (propertyUnits.length > 0 && !unit) return "اختر الوحدة المراد تأجيرها";
        return null;
      case "owner":
        if (isNew && form.ownerMode === "existing" && !form.ownerId) return "اختر المالك";
        if (ownerIsNew) {
          if (!form.oName.trim() || !form.oPhone.trim()) return "أدخل اسم المالك ورقم جواله";
          if (!form.oId.trim() || !form.oBirth || !form.oAbsher.trim()) return "أكمل هوية المالك وتاريخ ميلاده وجوال أبشر";
        }
        return null;
      case "property":
        if (!form.pTitle.trim()) return "أدخل اسم العقار";
        if (!form.pCity.trim() || !form.pDistrict.trim()) return "حدد الموقع، أو أدخل المدينة والحي";
        return null;
      case "units":
        if (Number(form.unitCount) > 0 && unitRows.some((r) => !r.unitNumber.trim())) return "أدخل رقم كل وحدة";
        return null;
      case "tenant":
        if (form.tenantMode === "existing" && !form.tenantId) return "اختر المستأجر";
        if (form.tenantMode === "new") {
          if (!form.tName.trim() || !form.tPhone.trim()) return "أدخل اسم المستأجر ورقم جواله";
          if (!form.tId.trim() || !form.tBirth || !form.tAbsher.trim()) return "أكمل هوية المستأجر وتاريخ ميلاده وجوال أبشر";
        }
        return null;
      case "rent":
        return !(annual > 0) ? "أدخل قيمة الإيجار السنوي" : null;
      case "payments":
        if (schedule.length === 0) return "لا يوجد جدول دفعات. تأكد من المدة وقيمة الإيجار";
        if (schedule.some((p) => !p.dueDate || !(Number(p.amount) > 0))) return "أكمل تاريخ وقيمة كل دفعة";
        return null;
      default:
        return null;
    }
  }

  function next() {
    const msg = validate(step);
    if (msg) return setError(msg);
    setError(null);
    setStepIdx((i) => Math.min(i + 1, flow.length - 1));
  }

  // ---- submit ---------------------------------------------------------------------
  async function submit() {
    for (let i = 0; i < flow.length - 1; i++) {
      const msg = validate(flow[i]);
      if (msg) {
        setStepIdx(i);
        return setError(msg);
      }
    }
    setSubmitting(true);
    try {
      const now = today();
      let ownerId = effectiveOwnerId;

      if (ownerIsNew) {
        ownerId = await createOwner({
          name: form.oName,
          phone: form.oPhone,
          email: form.oEmail || undefined,
          idNumber: form.oId || undefined,
          birthDate: form.oBirth || undefined,
          absherPhone: form.oAbsher || undefined,
          joinedAt: now,
        });
        try {
          const idToken = await getFirebaseAuth().currentUser?.getIdToken();
          const res = await fetch("/api/owners/create-account", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ ownerId }),
          });
          if (res.ok) setCredentials(await res.json());
        } catch {
          // the owner is saved either way; an admin can create the login later
        }
      } else if (owner) {
        const patch = {
          ...(form.oId.trim() && form.oId !== (owner.idNumber ?? "") ? { idNumber: form.oId.trim() } : {}),
          ...(form.oBirth && form.oBirth !== (owner.birthDate ?? "") ? { birthDate: form.oBirth } : {}),
          ...(form.oAbsher.trim() && form.oAbsher !== (owner.absherPhone ?? "") ? { absherPhone: form.oAbsher.trim() } : {}),
        };
        if (Object.keys(patch).length) await updateOwner(owner.id, patch);
      }

      const meters = {
        electricityMeterNumber: form.elecNo.trim() || undefined,
        electricityMeterBilledTo: form.elecNo.trim() ? form.elecBy : undefined,
        waterMeterNumber: form.waterNo.trim() || undefined,
        waterMeterBilledTo: form.waterNo.trim() ? form.waterBy : undefined,
        gasMeterNumber: form.gasNo.trim() || undefined,
        gasMeterBilledTo: form.gasNo.trim() ? form.gasBy : undefined,
      };
      const definedMeters = Object.fromEntries(Object.entries(meters).filter(([, v]) => v !== undefined));

      let propertyId = form.propertyId;
      let leasedUnitId = form.unitId;
      let contractOwnerId = property?.ownerId ?? ownerId;

      if (isNew) {
        contractOwnerId = ownerId;
        const hasUnits = unitRows.length > 0;
        propertyId = await createProperty({
          title: form.pTitle,
          type: form.pType,
          city: form.pCity,
          district: form.pDistrict,
          address: [form.pStreet, form.pBuilding].filter(Boolean).join(" - ") || form.pDistrict,
          area: Number(form.pArea) || 0,
          bedrooms: 0,
          bathrooms: 0,
          price: 0,
          listingType: "إيجار",
          status: hasUnits ? "متاحة" : "مؤجرة",
          ownerId,
          floors: Number(form.pFloors) || undefined,
          lat: form.lat,
          lng: form.lng,
          color: MARKER_COLORS[properties.length % MARKER_COLORS.length],
          createdAt: now,
          deedType: form.pDeedType,
          deedIssueDate: form.pDeedIssue || undefined,
          region: form.pRegion || undefined,
          street: form.pStreet || undefined,
          buildingNumber: form.pBuilding || undefined,
          subNumber: form.pSub || undefined,
          postalCode: form.pPostal || undefined,
          usage: form.usage === "تجاري" ? "تجاري" : "سكن عائلات",
          ...(hasUnits ? {} : definedMeters),
        });
        await createDocumentLink({
          title: `صك ملكية - ${form.pTitle}`,
          category: "صك ملكية",
          entityType: "عقار",
          entityId: propertyId,
          entityLabel: form.pTitle,
          ownerId,
          url: deedFile?.dataUrl ?? form.pDeedLink.trim(),
          createdAt: now,
        });
        leasedUnitId = "";
        for (let i = 0; i < unitRows.length; i++) {
          const r = unitRows[i];
          const leased = i === Number(form.leasedUnit);
          const id = await createUnit({
            propertyId,
            ownerId,
            unitNumber: r.unitNumber,
            floor: Number(r.floor) || 0,
            type: r.type as (typeof UNIT_TYPES)[number],
            area: Number(r.area) || 0,
            bedrooms: Number(r.bedrooms) || 0,
            bathrooms: Number(r.bathrooms) || 0,
            price: 0,
            listingType: "إيجار",
            status: leased ? "مؤجرة" : "متاحة",
            createdAt: now,
            ...(leased ? definedMeters : {}),
          });
          if (leased) leasedUnitId = id;
        }
      } else if (Object.keys(definedMeters).length) {
        if (leasedUnitId) await updateUnit(leasedUnitId, definedMeters);
        else await updateProperty(propertyId, definedMeters);
      }

      let tenantId = form.tenantId;
      if (form.tenantMode === "new") {
        tenantId = await createTenant({
          name: form.tName,
          phone: form.tPhone,
          idNumber: form.tId || undefined,
          birthDate: form.tBirth || undefined,
          absherPhone: form.tAbsher || undefined,
          secondaryPhone: form.tPhone2 || undefined,
          employer: form.tEmployer || undefined,
          idExpiryDate: form.tIdExpiry || undefined,
          propertyId,
          unitId: leasedUnitId || undefined,
          contractId: "",
        });
      }

      const payments = schedule.map((p, i) => ({ ...p, id: String(i + 1), amount: Number(p.amount) || 0 }));
      const id = await createContract(
        {
          propertyId,
          unitId: leasedUnitId || undefined,
          ownerId: contractOwnerId,
          tenantId,
          type: "إيجار",
          usage: form.usage,
          signedAt: form.signedAt || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          value: payments.reduce((s, p) => s + p.amount, 0),
          paymentCycle: form.cycle,
          status: "نشط",
          documentUrl: form.documentUrl || undefined,
          externalContractNo: form.externalContractNo || undefined,
        },
        payments
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
    setStepIdx(0);
    setForm(emptyForm());
    setDeedFile(null);
    setDur({ y: "", m: "", d: "" });
    setUnitRows([]);
    setSchedule([]);
    lastKey.current = "";
    setImportedPayments(null);
    setNotice(null);
    setGeoNote(null);
    setError(null);
    setCreatedId(null);
    setCredentials(null);
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
            <p className="text-muted max-w-md">{t("حُفظ العقد وجدول دفعاته، ويظهر الآن في قائمة العقود.")}</p>
            {credentials && (
              <div className="rounded-xl bg-surface-sunken px-5 py-4 text-sm text-start max-w-md w-full">
                <p className="font-bold mb-2">{t("حساب دخول المالك الجديد")}</p>
                <p dir="ltr" className="text-start">{credentials.email}</p>
                <p dir="ltr" className="text-start">{credentials.password}</p>
                <p className="mt-2 text-xs text-muted">{t("شارك هذه البيانات مع المالك. لن تظهر مرة أخرى.")}</p>
              </div>
            )}
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
  const seg = (value: string, options: { key: string; label: string }[], onPick: (k: string) => void) => (
    <div className="inline-flex flex-wrap rounded-xl bg-surface-sunken p-1 w-fit text-sm font-semibold">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onPick(o.key)}
          className={cn("pressable px-4 min-h-10 rounded-lg", value === o.key ? "bg-surface shadow-control" : "text-muted")}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
  const personFields = (p: "o" | "t", withExtras: boolean, lockBasics = false) => {
    const k = (s: string) => `${p}${s}` as keyof Form;
    const val = (s: string) => String(form[k(s)]);
    const on = (s: string) => (e: React.ChangeEvent<HTMLInputElement>) => set(k(s), e.target.value as never);
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={field}>
          <Label htmlFor={`${p}name`}>الاسم</Label>
          <Input id={`${p}name`} value={val("Name")} onChange={on("Name")} disabled={lockBasics} />
        </div>
        <div className={field}>
          <Label htmlFor={`${p}phone`}>جوال التواصل</Label>
          <Input id={`${p}phone`} inputMode="tel" dir="ltr" value={val("Phone")} onChange={on("Phone")} disabled={lockBasics} />
        </div>
        <div className={field}>
          <Label htmlFor={`${p}id`}>رقم الهوية / الإقامة</Label>
          <Input id={`${p}id`} inputMode="numeric" dir="ltr" value={val("Id")} onChange={on("Id")} />
        </div>
        <div className={field}>
          <Label htmlFor={`${p}birth`}>تاريخ الميلاد</Label>
          <Input id={`${p}birth`} type="date" value={val("Birth")} onChange={on("Birth")} />
        </div>
        <div className={field}>
          <Label htmlFor={`${p}absher`}>جوال أبشر</Label>
          <Input id={`${p}absher`} inputMode="tel" dir="ltr" value={val("Absher")} onChange={on("Absher")} />
          <p className="mt-1 text-xs text-muted">{t("الرقم المسجّل في أبشر للتحقق من الهوية.")}</p>
        </div>
        {withExtras && (
          <>
            <div className={field}>
              <Label htmlFor="tidexp">تاريخ انتهاء الهوية</Label>
              <Input id="tidexp" type="date" value={form.tIdExpiry} onChange={(e) => set("tIdExpiry", e.target.value)} />
            </div>
            <div className={field}>
              <Label htmlFor="tphone2">جوال آخر</Label>
              <Input id="tphone2" inputMode="tel" dir="ltr" value={form.tPhone2} onChange={(e) => set("tPhone2", e.target.value)} />
            </div>
            <div className={field}>
              <Label htmlFor="temp">جهة العمل</Label>
              <Input id="temp" value={form.tEmployer} onChange={(e) => set("tEmployer", e.target.value)} />
            </div>
          </>
        )}
      </div>
    );
  };
  const meterRow = (label: string, noKey: "elecNo" | "waterNo" | "gasNo", byKey: "elecBy" | "waterBy" | "gasBy", id: string) => (
    <div className="grid sm:grid-cols-2 gap-4 items-end">
      <div className={field}>
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} dir="ltr" inputMode="numeric" value={form[noKey]} onChange={(e) => set(noKey, e.target.value)} />
      </div>
      <div className={field}>
        <Label htmlFor={`${id}-by`}>من يدفع الرسوم؟</Label>
        <Select id={`${id}-by`} value={form[byKey]} onChange={(e) => set(byKey, e.target.value as MeterBilledTo)}>
          {METER_PAYERS.map((x) => (
            <option key={x} value={x}>
              {t(x)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );

  const sortedProperties = (() => {
    const commercial = (p: (typeof properties)[number]) => COMMERCIAL_PROPERTY.includes(p.type);
    const ok = properties.filter((p) => (form.usage === "تجاري" ? commercial(p) : !commercial(p)));
    return [...ok, ...properties.filter((p) => !ok.includes(p))];
  })();

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
            {flow.map((k, i) => (
              <li key={k} className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-7 w-7 rounded-full grid place-items-center text-xs font-bold num",
                    i < stepIdx ? "bg-success-50 text-success-700" : i === stepIdx ? "bg-primary text-on-primary" : "bg-surface-sunken text-muted"
                  )}
                  aria-current={i === stepIdx ? "step" : undefined}
                >
                  {i < stepIdx ? <CheckIcon width={14} height={14} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className={cn("text-sm font-semibold", i === stepIdx ? "text-foreground" : "text-muted hidden md:inline")}>{t(STEP_LABEL[k])}</span>
                {i < flow.length - 1 && <span className="w-3 h-px bg-border-strong hidden sm:block" />}
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

          {step === "term" && (
            <div className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className={field}>
                  <Label htmlFor="start">بداية العقد</Label>
                  <Input id="start" type="date" value={form.startDate} onChange={(e) => onStart(e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="end">نهاية العقد</Label>
                  <Input id="end" type="date" value={form.endDate} onChange={(e) => onEnd(e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="signed">تاريخ إبرام العقد</Label>
                  <Input id="signed" type="date" value={form.signedAt} onChange={(e) => set("signedAt", e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/70 mb-1.5">{t("مدة العقد")}</p>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <div className={field}>
                    <Label htmlFor="d-y">سنوات</Label>
                    <Input id="d-y" type="number" min="0" inputMode="numeric" value={dur.y} onChange={(e) => onDur({ y: e.target.value })} />
                  </div>
                  <div className={field}>
                    <Label htmlFor="d-m">أشهر</Label>
                    <Input id="d-m" type="number" min="0" inputMode="numeric" value={dur.m} onChange={(e) => onDur({ m: e.target.value })} />
                  </div>
                  <div className={field}>
                    <Label htmlFor="d-d">أيام</Label>
                    <Input id="d-d" type="number" min="0" inputMode="numeric" value={dur.d} onChange={(e) => onDur({ d: e.target.value })} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {t("المدة:")} <span className="num font-bold text-foreground">{durationText}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{t("اكتب تاريخ البداية والمدة فتُحسب النهاية تلقائيًا (اليوم السابق لذكرى البداية)، أو اكتب البداية والنهاية فتُحسب المدة.")}</p>
              </div>

              <div className="border-t border-border pt-5 flex flex-col gap-4">
                <p className="text-sm font-bold">{t("العقار")}</p>
                {seg(form.mode, [{ key: "new", label: "عقار جديد" }, { key: "existing", label: "عقار موجود" }], (k) => {
                  set("mode", k as Form["mode"]);
                  setStepIdx(0);
                })}
                <label className="pressable cursor-pointer rounded-2xl border-2 border-dashed border-border-strong p-4 flex items-center gap-3 hover:bg-surface-sunken/60">
                  <Upload size={20} className="text-brand-700 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{t("لديك ملف عقد من إيجار؟")}</span>
                    <span className="block text-xs text-muted">{t("ارفع ملف PDF لتعبئة بيانات العقد تلقائيًا، ثم راجعها.")}</span>
                  </span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={importFile} />
                </label>
              </div>
            </div>
          )}

          {step === "deed" && (
            <div className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className={field}>
                  <Label htmlFor="pdeedtype">نوع الصك</Label>
                  <Select id="pdeedtype" value={form.pDeedType} onChange={(e) => set("pDeedType", e.target.value as Form["pDeedType"])}>
                    {DEED_TYPES.map((x) => (
                      <option key={x} value={x}>
                        {t(x)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className={field}>
                  <Label htmlFor="pdeedissue">تاريخ إصدار الصك</Label>
                  <Input id="pdeedissue" type="date" value={form.pDeedIssue} onChange={(e) => set("pDeedIssue", e.target.value)} />
                </div>
              </div>
              <label className="pressable cursor-pointer rounded-xl border-2 border-dashed border-border-strong p-4 flex items-center gap-3 hover:bg-surface-sunken">
                <Upload size={20} className="text-brand-700 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate">{deedFile ? deedFile.name : t("أرفق ملف الصك")}</span>
                  <span className="block text-xs text-muted">{t("PDF أو صورة، بحد أقصى 650 كيلوبايت.")}</span>
                </span>
                {deedFile && <CheckIcon width={20} height={20} className="text-success-700 shrink-0" strokeWidth={2.5} />}
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={attachDeed} />
              </label>
              <div className={cn(field, "max-w-xl")}>
                <Label htmlFor="pdeedlink">أو رابط الصك</Label>
                <Input id="pdeedlink" type="url" dir="ltr" placeholder="https://" value={form.pDeedLink} onChange={(e) => set("pDeedLink", e.target.value)} />
              </div>
            </div>
          )}

          {step === "pick" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={field}>
                <Label htmlFor="usage">الاستخدام</Label>
                <Select id="usage" value={form.usage} onChange={(e) => set("usage", e.target.value as Usage)}>
                  <option value="سكني">{t("سكني")}</option>
                  <option value="تجاري">{t("تجاري")}</option>
                </Select>
              </div>
              <div />
              <div className={field}>
                <Label htmlFor="property">العقار</Label>
                <Select id="property" value={form.propertyId} onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value, unitId: "" }))}>
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
              {properties.length === 0 && <p className="sm:col-span-2 text-sm text-warning-700">{t("لا توجد عقارات مرتبطة بحسابك. أضف عقارًا جديدًا.")}</p>}
            </div>
          )}

          {step === "owner" && (
            <div className="flex flex-col gap-4">
              {isNew &&
                seg(form.ownerMode, [{ key: "new", label: "مالك جديد" }, { key: "existing", label: "مالك موجود" }], (k) => set("ownerMode", k as Form["ownerMode"]))}
              {isNew && form.ownerMode === "existing" && (
                <div className={cn(field, "max-w-md")}>
                  <Label htmlFor="ownersel">المالك</Label>
                  <Select id="ownersel" value={form.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
                    <option value="">{t("اختر المالك")}</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.phone}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {(ownerIsNew || owner) && (
                <>
                  {!ownerIsNew && <p className="text-sm text-muted">{t("راجع بيانات المالك وأكمل الناقص منها.")}</p>}
                  {personFields("o", false, !ownerIsNew)}
                </>
              )}
            </div>
          )}

          {step === "property" && (
            <div className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={field}>
                  <Label htmlFor="ptype">نوع العقار</Label>
                  <Select id="ptype" value={form.pType} onChange={(e) => set("pType", e.target.value as PropertyType)}>
                    {PROPERTY_TYPES.map((x) => (
                      <option key={x} value={x}>
                        {t(x)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className={field}>
                  <Label htmlFor="pusage">الاستخدام</Label>
                  <Select id="pusage" value={form.usage} onChange={(e) => set("usage", e.target.value as Usage)}>
                    <option value="سكني">{t("سكني")}</option>
                    <option value="تجاري">{t("تجاري")}</option>
                  </Select>
                </div>
                <div className={field}>
                  <Label htmlFor="pfloors">عدد الأدوار</Label>
                  <Input id="pfloors" type="number" min="0" inputMode="numeric" value={form.pFloors} onChange={(e) => set("pFloors", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="parea">المساحة (م²)</Label>
                  <Input id="parea" type="number" min="0" inputMode="decimal" value={form.pArea} onChange={(e) => set("pArea", e.target.value)} />
                </div>
                <div className={cn(field, "sm:col-span-2 lg:col-span-4")}>
                  <Label htmlFor="ptitle">اسم العقار</Label>
                  <Input id="ptitle" placeholder={t("مثال: عقار محمد الأحمد")} value={form.pTitle} onChange={(e) => set("pTitle", e.target.value)} />
                </div>
              </div>

              <div>
                <p className="text-sm font-bold">{t("موقع العقار")}</p>
                <p className="text-xs text-muted mt-1 mb-2">{t("اضغط على الخريطة أو اسحب الدبوس لتحديد الموقع، وسيُملأ العنوان تلقائيًا.")}</p>
                <div className="h-72 rounded-xl overflow-hidden border border-border">
                  <LocationPicker lat={form.lat} lng={form.lng} onChange={pickLocation} />
                </div>
                {geoNote && <p className="mt-2 text-xs text-muted">{geoNote}</p>}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={field}>
                  <Label htmlFor="pregion">المنطقة</Label>
                  <Select id="pregion" value={form.pRegion} onChange={(e) => setForm((f) => ({ ...f, pRegion: e.target.value }))}>
                    <option value="">{t("اختر المنطقة")}</option>
                    {SAUDI_REGIONS.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className={field}>
                  <Label htmlFor="pcity">المدينة</Label>
                  <Input id="pcity" list="city-list" value={form.pCity} onChange={(e) => set("pCity", e.target.value)} />
                  <datalist id="city-list">
                    {regionCities.map((c) => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div className={field}>
                  <Label htmlFor="pdistrict">الحي</Label>
                  <Input id="pdistrict" value={form.pDistrict} onChange={(e) => set("pDistrict", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="pstreet">اسم الشارع</Label>
                  <Input id="pstreet" value={form.pStreet} onChange={(e) => set("pStreet", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="pbuilding">رقم المبنى</Label>
                  <Input id="pbuilding" inputMode="numeric" dir="ltr" value={form.pBuilding} onChange={(e) => set("pBuilding", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="psub">الرمز الإضافي</Label>
                  <Input id="psub" inputMode="numeric" dir="ltr" value={form.pSub} onChange={(e) => set("pSub", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="ppostal">الرمز البريدي</Label>
                  <Input id="ppostal" inputMode="numeric" dir="ltr" value={form.pPostal} onChange={(e) => set("pPostal", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === "units" && (
            <div className="flex flex-col gap-5">
              <div className={cn(field, "max-w-xs")}>
                <Label htmlFor="ucount">عدد الوحدات في العقار</Label>
                <Input id="ucount" type="number" min="0" max="60" inputMode="numeric" value={form.unitCount} onChange={(e) => setUnitCount(e.target.value)} />
                <p className="mt-1 text-xs text-muted">{t("اتركه 0 إذا كان العقار وحدة واحدة.")}</p>
              </div>
              {unitRows.length > 0 && (
                <>
                  <ul className="flex flex-col gap-3">
                    {unitRows.map((r, i) => (
                      <li key={i} className="rounded-2xl bg-surface-sunken/60 p-4">
                        <p className="text-sm font-bold mb-3">
                          {t("وحدة")} <span className="num">{i + 1}</span>
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                          <div className={field}>
                            <Label htmlFor={`un-${i}`}>رقم الوحدة</Label>
                            <Input id={`un-${i}`} value={r.unitNumber} onChange={(e) => editUnit(i, { unitNumber: e.target.value })} />
                          </div>
                          <div className={cn(field, "lg:col-span-2")}>
                            <Label htmlFor={`ut-${i}`}>النوع</Label>
                            <Select id={`ut-${i}`} value={r.type} onChange={(e) => editUnit(i, { type: e.target.value })}>
                              {UNIT_TYPES.map((x) => (
                                <option key={x} value={x}>
                                  {x}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className={field}>
                            <Label htmlFor={`uf-${i}`}>الطابق</Label>
                            <Input id={`uf-${i}`} type="number" inputMode="numeric" value={r.floor} onChange={(e) => editUnit(i, { floor: e.target.value })} />
                          </div>
                          <div className={field}>
                            <Label htmlFor={`ua-${i}`}>المساحة (م²)</Label>
                            <Input id={`ua-${i}`} type="number" min="0" inputMode="decimal" value={r.area} onChange={(e) => editUnit(i, { area: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className={field}>
                              <Label htmlFor={`ub-${i}`}>غرف النوم</Label>
                              <Input id={`ub-${i}`} type="number" min="0" inputMode="numeric" value={r.bedrooms} onChange={(e) => editUnit(i, { bedrooms: e.target.value })} />
                            </div>
                            <div className={field}>
                              <Label htmlFor={`uh-${i}`}>دورات المياه</Label>
                              <Input id={`uh-${i}`} type="number" min="0" inputMode="numeric" value={r.bathrooms} onChange={(e) => editUnit(i, { bathrooms: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className={cn(field, "max-w-sm")}>
                    <Label htmlFor="leased">الوحدة المؤجرة بهذا العقد</Label>
                    <Select id="leased" value={form.leasedUnit} onChange={(e) => set("leasedUnit", e.target.value)}>
                      {unitRows.map((r, i) => (
                        <option key={i} value={String(i)}>
                          {t("وحدة")} {r.unitNumber || i + 1} — {r.type}
                        </option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {step === "tenant" && (
            <div className="flex flex-col gap-4">
              {seg(form.tenantMode, [{ key: "new", label: "مستأجر جديد" }, { key: "existing", label: "مستأجر موجود" }], (k) => set("tenantMode", k as Form["tenantMode"]))}
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
                personFields("t", true)
              )}
            </div>
          )}

          {step === "rent" && (
            <div className="flex flex-col gap-6">
              <div className={cn(field, "max-w-sm")}>
                <Label htmlFor="rent">قيمة الإيجار السنوي</Label>
                <Input id="rent" type="number" min="0" inputMode="decimal" value={form.annualRent} onChange={(e) => set("annualRent", e.target.value)} />
                {annual > 0 && termOk && (
                  <p className="mt-1.5 text-sm text-muted">
                    {t("إجمالي العقد")} ({durationText}): <span className="num font-bold text-foreground">{currency(contractTotal)}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <p className="text-sm font-bold">{t("العدادات")}</p>
                {meterRow("رقم عداد الكهرباء", "elecNo", "elecBy", "elec")}
                {meterRow("رقم عداد المياه", "waterNo", "waterBy", "water")}
                {meterRow("رقم عداد الغاز", "gasNo", "gasBy", "gas")}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className={field}>
                  <Label htmlFor="ejar">رقم العقد في إيجار</Label>
                  <Input id="ejar" dir="ltr" value={form.externalContractNo} onChange={(e) => set("externalContractNo", e.target.value)} />
                </div>
                <div className={field}>
                  <Label htmlFor="docurl">رابط نسخة العقد</Label>
                  <Input id="docurl" type="url" dir="ltr" placeholder="https://" value={form.documentUrl} onChange={(e) => set("documentUrl", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === "payments" && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-bold mb-2">{t("دورة الدفع")}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2" role="radiogroup" aria-label={t("دورة الدفع")}>
                  {CYCLES.map((c) => {
                    const active = form.cycle === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setImportedPayments(null);
                          set("cycle", c.key);
                        }}
                        className={cn(
                          "pressable text-start rounded-xl p-3 min-h-16",
                          active ? "bg-primary text-on-primary shadow-raised" : "bg-surface-sunken/60 hover:bg-surface-sunken"
                        )}
                      >
                        <span className="block font-bold">{t(c.label)}</span>
                        <span className={cn("block text-xs mt-0.5", active ? "text-white/85" : "text-muted")}>{t(c.hint)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-bold">
                    {t("جدول الدفعات")} <Badge tone="brand">{schedule.length}</Badge>
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSchedule((rows) => [...rows, { id: String(rows.length + 1), dueDate: form.endDate, amount: 0, status: "مستحقة" }])
                    }
                  >
                    {t("إضافة دفعة")}
                  </Button>
                </div>
                <ul className="flex flex-col gap-2">
                  {schedule.map((p, i) => (
                    <li key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-xl bg-surface-sunken/60 p-2.5">
                      <span className="num w-7 text-center text-xs font-bold text-muted">{i + 1}</span>
                      <Input aria-label={t("تاريخ الدفعة")} type="date" value={p.dueDate} onChange={(e) => editPayment(i, { dueDate: e.target.value })} />
                      <Input
                        aria-label={t("قيمة الدفعة")}
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={p.amount}
                        onChange={(e) => editPayment(i, { amount: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        aria-label={t("حذف الدفعة")}
                        onClick={() => setSchedule((rows) => rows.filter((_, idx) => idx !== i))}
                        className="pressable grid place-items-center h-10 w-10 rounded-lg text-muted hover:text-danger-600 hover:bg-danger-50"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                  {schedule.length === 0 && <li className="py-3 text-sm text-muted">{t("أكمل المدة وقيمة الإيجار لعرض الجدول.")}</li>}
                </ul>
                <p className={cn("mt-3 text-sm", scheduleSum === contractTotal ? "text-muted" : "text-warning-700 font-semibold")}>
                  {t("مجموع الدفعات")}: <span className="num font-bold">{currency(scheduleSum)}</span>
                  {scheduleSum !== contractTotal && (
                    <>
                      {" "}
                      · {t("إجمالي العقد")}: <span className="num">{currency(contractTotal)}</span>
                    </>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted">{t("يمكنك تعديل تاريخ وقيمة أي دفعة. تغيير المدة أو الإيجار أو دورة الدفع يعيد توليد الجدول.")}</p>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col gap-5">
              <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                <Row label={t("مدة العقد")} value={durationText} />
                <Row label={t("بداية العقد")} value={form.startDate} num />
                <Row label={t("ينتهي العقد")} value={form.endDate} num />
                <Row label={t("الاستخدام")} value={t(form.usage)} />
                <Row label={t("العقار")} value={isNew ? `${form.pTitle} (${t("جديد")})` : property?.title ?? "—"} />
                {isNew && <Row label={t("نوع العقار")} value={t(form.pType)} />}
                {isNew && <Row label={t("عدد الأدوار")} value={form.pFloors || "—"} num />}
                {isNew && <Row label={t("الموقع")} value={[form.pCity, form.pDistrict, form.pStreet].filter(Boolean).join("، ") || "—"} />}
                {isNew && <Row label={t("عدد الوحدات")} value={String(unitRows.length || 1)} num />}
                <Row label={t("الوحدة")} value={isNew ? (unitRows[Number(form.leasedUnit)] ? `${unitRows[Number(form.leasedUnit)].unitNumber} — ${unitRows[Number(form.leasedUnit)].type}` : t("العقار كاملًا (وحدة واحدة)")) : unit ? `${unit.unitNumber} — ${unit.type}` : t("العقار كاملًا (وحدة واحدة)")} />
                {isNew && <Row label={t("صك الملكية")} value={deedFile ? deedFile.name : form.pDeedLink || "—"} />}
                <Row label={t("المالك")} value={form.oName || owner?.name || "—"} />
                <Row label={t("هوية المالك")} value={form.oId || "—"} num />
                <Row label={t("جوال أبشر (المالك)")} value={form.oAbsher || "—"} num />
                <Row label={t("المستأجر")} value={form.tenantMode === "new" ? form.tName : existingTenant?.name ?? "—"} />
                {form.tenantMode === "new" && <Row label={t("هوية المستأجر")} value={form.tId} num />}
                {form.tenantMode === "new" && <Row label={t("جوال أبشر (المستأجر)")} value={form.tAbsher} num />}
                <Row label={t("الإيجار السنوي")} value={currency(annual)} num />
                <Row label={t("إجمالي العقد")} value={currency(scheduleSum)} num />
                <Row label={t("دورة الدفع")} value={t(form.cycle)} />
              </dl>
              <ul className="max-h-60 overflow-y-auto divide-y divide-border rounded-xl bg-surface-sunken/60 px-3">
                {schedule.map((p, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="num text-muted">{p.dueDate}</span>
                    <span className="num font-semibold">{currency(Number(p.amount) || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-danger-50 text-danger-700 px-3.5 py-2.5 text-sm font-semibold">
              {t(error)}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="outline" onClick={() => (setError(null), setStepIdx((i) => Math.max(0, i - 1)))} disabled={stepIdx === 0 || submitting}>
              {t("السابق")}
            </Button>
            {stepIdx < flow.length - 1 ? (
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
      <dd className={cn("font-semibold break-words", num && "num")}>{value}</dd>
    </div>
  );
}
