"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { useOwners, useProperties } from "@/lib/firestore/hooks";
import { createOwner, createProperty, createUnit } from "@/lib/firestore/mutations";
import { UNIT_AMENITIES, UNIT_TYPES } from "@/lib/types";
import type { MeterBilledTo, PropertyType, UnitType } from "@/lib/types";
import {
  AirVent,
  Archive,
  ArrowLeft,
  ArrowRight,
  Armchair,
  Bath,
  BedDouble,
  ChefHat,
  Copy,
  Fan,
  Plus,
  Snowflake,
  Sofa,
  Trash2,
  Trees,
  User,
  Wind,
} from "lucide-react";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-muted text-sm">جارِ تحميل الخريطة...</div>,
});

const PROPERTY_TYPES: PropertyType[] = ["أرض", "عمارة", "فيلا", "مجمع تجاري مفتوح", "مجمع تجاري مغلق", "برج", "استراحة", "أخرى"];
const DEED_TYPES = ["إلكتروني", "ورقي", "عقد إيجار", "سجل عقاري"] as const;
const USAGE_TYPES = ["سكن عائلات", "سكن أفراد", "تجاري", "سكني-تجاري", "سكن جماعي"] as const;
const MARKER_COLORS = ["#3563f4", "#1fa35c", "#e0a318", "#dc3b3b", "#2196d8", "#1c3ab3"];
const METER_BILLED_TO: MeterBilledTo[] = ["المالك", "المستأجر"];
const DEFAULT_LAT = 24.7136;
const DEFAULT_LNG = 46.6753;

const AMENITY_ICONS: Record<(typeof UNIT_AMENITIES)[number], typeof Bath> = {
  "دورة مياه": Bath,
  "غرف نوم": BedDouble,
  "غرفة الخادمة": User,
  "صالات": Sofa,
  "مخزن": Archive,
  "مطبخ": ChefHat,
  "مجلس": Armchair,
  "الفناء الخلفي": Trees,
  "مكيف سبليت": Wind,
  "مكيف مركزي": AirVent,
  "مكيف شباك": Fan,
  "مكيف صحراوي": Snowflake,
};

interface CoOwnerDraft {
  name: string;
  idNumber: string;
  birthDate: string;
  phone: string;
}

interface UnitDraft {
  id: string;
  unitNumber: string;
  type: UnitType;
  floor: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  price: string;
  listingType: "إيجار" | "بيع";
  furnished: boolean;
  furnitureCondition: "جديد" | "مستخدم";
  amenities: string[];
  electricityMeterNumber: string;
  electricityMeterBilledTo: MeterBilledTo;
  waterMeterNumber: string;
  waterMeterBilledTo: MeterBilledTo;
}

function emptyUnitDraft(): UnitDraft {
  return {
    id: "",
    unitNumber: "",
    type: "شقة",
    floor: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
    listingType: "إيجار",
    furnished: false,
    furnitureCondition: "جديد",
    amenities: [],
    electricityMeterNumber: "",
    electricityMeterBilledTo: "المستأجر",
    waterMeterNumber: "",
    waterMeterBilledTo: "المستأجر",
  };
}

// Splits a trailing number off a unit name so bulk-copy can continue the
// sequence — "شقة-1" → { prefix: "شقة-", start: 1 } so N copies produce
// "شقة-1".."شقة-N". No trailing number falls back to "<name>-1", "-2", ….
function parseNameParts(name: string): { prefix: string; start: number } {
  const m = name.match(/^(.*?)(\d+)$/);
  if (m) return { prefix: m[1], start: Number(m[2]) };
  return { prefix: `${name}-`, start: 1 };
}

export default function NewPropertyWizardPage() {
  const router = useRouter();
  const { data: owners } = useOwners();
  const { data: properties } = useProperties();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — owner(s) + deed
  const [ownerMode, setOwnerMode] = useState<"existing" | "new">("existing");
  const [ownerId, setOwnerId] = useState("");
  const [newOwner, setNewOwner] = useState({ name: "", idNumber: "", birthDate: "", phone: "" });
  const [coOwners, setCoOwners] = useState<CoOwnerDraft[]>([]);
  const [deedType, setDeedType] = useState<(typeof DEED_TYPES)[number]>("سجل عقاري");
  const [deedIssueDate, setDeedIssueDate] = useState("");

  // Step 2 — location
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [subNumber, setSubNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);

  // Step 3 — property details
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PropertyType>("عمارة");
  const [propertyNumber, setPropertyNumber] = useState("");
  const [usage, setUsage] = useState<(typeof USAGE_TYPES)[number]>("سكني-تجاري");
  const [price, setPrice] = useState("");
  const [listingType, setListingType] = useState<"إيجار" | "بيع" | "استثمار">("إيجار");
  const [area, setArea] = useState("");
  const [electricityMeterNumber, setElectricityMeterNumber] = useState("");
  const [electricityMeterBilledTo, setElectricityMeterBilledTo] = useState<MeterBilledTo>("المستأجر");
  const [waterMeterNumber, setWaterMeterNumber] = useState("");
  const [waterMeterBilledTo, setWaterMeterBilledTo] = useState<MeterBilledTo>("المستأجر");

  // Step 4 — units
  const [units, setUnits] = useState<UnitDraft[]>([]);
  const [unitDraft, setUnitDraft] = useState<UnitDraft>(emptyUnitDraft());
  const [copyCount, setCopyCount] = useState("1");
  const [amenitiesMode, setAmenitiesMode] = useState<"none" | "has" | null>(null);

  const canGoStep1 = ownerMode === "existing" ? !!ownerId : !!newOwner.name.trim();
  const canGoStep2 = !!city.trim() && !!district.trim();
  const canGoStep3 = !!title.trim() && !!Number(price);

  function addCoOwner() {
    setCoOwners((list) => [...list, { name: "", idNumber: "", birthDate: "", phone: "" }]);
  }
  function updateCoOwner(index: number, patch: Partial<CoOwnerDraft>) {
    setCoOwners((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }
  function removeCoOwner(index: number) {
    setCoOwners((list) => list.filter((_, i) => i !== index));
  }

  function toggleAmenity(a: string) {
    setUnitDraft((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  function handleAddUnit() {
    if (!unitDraft.unitNumber.trim() || amenitiesMode === null) return;
    if (amenitiesMode === "has" && unitDraft.amenities.length === 0) return;

    const count = Math.max(1, Number(copyCount) || 1);
    const { prefix, start } = parseNameParts(unitDraft.unitNumber);
    const finalAmenities = amenitiesMode === "has" ? unitDraft.amenities : [];
    const newUnits: UnitDraft[] = Array.from({ length: count }, (_, i) => ({
      ...unitDraft,
      id: `${Date.now()}-${i}`,
      unitNumber: count === 1 ? unitDraft.unitNumber : `${prefix}${start + i}`,
      amenities: finalAmenities,
    }));
    setUnits((list) => [...list, ...newUnits]);
    setUnitDraft(emptyUnitDraft());
    setCopyCount("1");
    setAmenitiesMode(null);
  }

  function removeUnit(id: string) {
    setUnits((list) => list.filter((u) => u.id !== id));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      let finalOwnerId = ownerId;
      if (ownerMode === "new") {
        finalOwnerId = await createOwner({
          name: newOwner.name,
          phone: newOwner.phone,
          idNumber: newOwner.idNumber || undefined,
          birthDate: newOwner.birthDate || undefined,
          joinedAt: today,
        });
      }

      const propertyId = await createProperty({
        title,
        type,
        city,
        district,
        address: [street, buildingNumber].filter(Boolean).join(" - ") || district,
        area: Number(area) || 0,
        bedrooms: 0,
        bathrooms: 0,
        price: Number(price),
        listingType,
        status: "متاحة",
        ownerId: finalOwnerId,
        lat,
        lng,
        color: MARKER_COLORS[properties.length % MARKER_COLORS.length],
        createdAt: today,
        deedType,
        deedIssueDate: deedIssueDate || undefined,
        region: region || undefined,
        street: street || undefined,
        buildingNumber: buildingNumber || undefined,
        subNumber: subNumber || undefined,
        postalCode: postalCode || undefined,
        propertyNumber: propertyNumber || undefined,
        usage,
        electricityMeterNumber: electricityMeterNumber || undefined,
        electricityMeterBilledTo: electricityMeterNumber ? electricityMeterBilledTo : undefined,
        waterMeterNumber: waterMeterNumber || undefined,
        waterMeterBilledTo: waterMeterNumber ? waterMeterBilledTo : undefined,
        coOwners: coOwners.filter((c) => c.name.trim()).length
          ? coOwners.filter((c) => c.name.trim()).map((c) => ({
              name: c.name,
              idNumber: c.idNumber || undefined,
              birthDate: c.birthDate || undefined,
              phone: c.phone || undefined,
            }))
          : undefined,
      });

      await Promise.all(
        units.map((u) =>
          createUnit({
            propertyId,
            ownerId: finalOwnerId,
            unitNumber: u.unitNumber,
            floor: Number(u.floor) || 0,
            type: u.type,
            area: Number(u.area) || 0,
            bedrooms: Number(u.bedrooms) || 0,
            bathrooms: Number(u.bathrooms) || 0,
            price: Number(u.price) || 0,
            listingType: u.listingType,
            status: "متاحة",
            createdAt: today,
            furnished: u.furnished,
            furnitureCondition: u.furnished ? u.furnitureCondition : undefined,
            amenities: u.amenities,
            electricityMeterNumber: u.electricityMeterNumber || undefined,
            electricityMeterBilledTo: u.electricityMeterNumber ? u.electricityMeterBilledTo : undefined,
            waterMeterNumber: u.waterMeterNumber || undefined,
            waterMeterBilledTo: u.waterMeterNumber ? u.waterMeterBilledTo : undefined,
          })
        )
      );

      router.push("/admin/properties");
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ["المالك والصك", "الموقع", "بيانات العقار", "الوحدات"];

  return (
    <DashboardShell allow={["admin", "leasingAgent", "custom"]} customResource="properties" title="عقار جديد">
      <div className="flex flex-col gap-6 max-w-4xl">
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3 | 4;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                    active ? "bg-brand-600 text-white" : done ? "bg-brand-50 text-brand-700" : "bg-background text-muted"
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">{n}</span>
                  {label}
                </div>
                {i < stepLabels.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>المالك والصك</CardTitle>
                <CardSubtitle>بيانات مالك العقار ووثيقة الملكية</CardSubtitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                  <button type="button" onClick={() => setOwnerMode("existing")} className={`px-3 py-1.5 font-semibold ${ownerMode === "existing" ? "bg-brand-600 text-white" : "text-muted"}`}>
                    مالك موجود
                  </button>
                  <button type="button" onClick={() => setOwnerMode("new")} className={`px-3 py-1.5 font-semibold ${ownerMode === "new" ? "bg-brand-600 text-white" : "text-muted"}`}>
                    مالك جديد
                  </button>
                </div>
              </div>

              {ownerMode === "existing" ? (
                <div>
                  <Label htmlFor="ownerSelect">المالك</Label>
                  <Select id="ownerSelect" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
                    <option value="" disabled>اختر مالكًا</option>
                    {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input placeholder="اسم المالك" value={newOwner.name} onChange={(e) => setNewOwner((f) => ({ ...f, name: e.target.value }))} required />
                  <Input placeholder="رقم الهوية" value={newOwner.idNumber} onChange={(e) => setNewOwner((f) => ({ ...f, idNumber: e.target.value }))} />
                  <Input type="date" aria-label="تاريخ الميلاد" value={newOwner.birthDate} onChange={(e) => setNewOwner((f) => ({ ...f, birthDate: e.target.value }))} />
                  <Input placeholder="رقم الجوال" dir="ltr" value={newOwner.phone} onChange={(e) => setNewOwner((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="mb-0">ملاك إضافيون (اختياري)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addCoOwner}>
                    <Plus size={14} /> إضافة مالك
                  </Button>
                </div>
                {coOwners.map((c, i) => (
                  <div key={i} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center rounded-xl border border-border p-3">
                    <Input placeholder="الاسم" value={c.name} onChange={(e) => updateCoOwner(i, { name: e.target.value })} />
                    <Input placeholder="رقم الهوية" value={c.idNumber} onChange={(e) => updateCoOwner(i, { idNumber: e.target.value })} />
                    <Input type="date" aria-label="تاريخ الميلاد" value={c.birthDate} onChange={(e) => updateCoOwner(i, { birthDate: e.target.value })} />
                    <Input placeholder="رقم الجوال" dir="ltr" value={c.phone} onChange={(e) => updateCoOwner(i, { phone: e.target.value })} />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeCoOwner(i)} className="text-danger-500 justify-self-start">
                      <Trash2 size={14} /> حذف
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deedType">نوع الصك</Label>
                  <Select id="deedType" value={deedType} onChange={(e) => setDeedType(e.target.value as (typeof DEED_TYPES)[number])}>
                    {DEED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deedIssueDate">تاريخ الإصدار</Label>
                  <Input id="deedIssueDate" type="date" value={deedIssueDate} onChange={(e) => setDeedIssueDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>موقع العقار</CardTitle>
                <CardSubtitle>العنوان التفصيلي وتحديد الموقع على الخريطة</CardSubtitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="region">المنطقة</Label>
                  <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="district">الحي</Label>
                  <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="street">الشارع</Label>
                  <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="buildingNumber">رقم المبنى</Label>
                  <Input id="buildingNumber" value={buildingNumber} onChange={(e) => setBuildingNumber(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="subNumber">الرقم الفرعي</Label>
                  <Input id="subNumber" value={subNumber} onChange={(e) => setSubNumber(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="postalCode">الرمز البريدي</Label>
                  <Input id="postalCode" dir="ltr" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>الموقع على الخريطة</Label>
                <p className="text-xs text-muted mb-2">اضغط على الخريطة أو اسحب الدبوس لتحديد الموقع بدقة</p>
                <div className="h-72 rounded-xl overflow-hidden border border-border">
                  <LocationPicker lat={lat} lng={lng} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>بيانات العقار</CardTitle>
                <CardSubtitle>تصنيف العقار وتفاصيله الأساسية</CardSubtitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">اسم العقار</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="propertyNumber">رقم العقار</Label>
                  <Input id="propertyNumber" value={propertyNumber} onChange={(e) => setPropertyNumber(e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">نوع العقار</Label>
                  <Select id="type" value={type} onChange={(e) => setType(e.target.value as PropertyType)}>
                    {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="usage">الاستخدام</Label>
                  <Select id="usage" value={usage} onChange={(e) => setUsage(e.target.value as (typeof USAGE_TYPES)[number])}>
                    {USAGE_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="area">المساحة (م²)</Label>
                  <Input id="area" type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="listingType">نوع العرض</Label>
                  <Select id="listingType" value={listingType} onChange={(e) => setListingType(e.target.value as "إيجار" | "بيع" | "استثمار")}>
                    <option value="إيجار">إيجار</option>
                    <option value="بيع">بيع</option>
                    <option value="استثمار">استثمار</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">السعر (﷼)</Label>
                  <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-muted mb-2">العدادات</p>
                <p className="text-xs text-muted mb-3">اترك رقم العداد فارغًا إن كان العقار سيُقسّم إلى وحدات — عدادات كل وحدة تُضاف في الخطوة التالية</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="elecMeter">رقم عداد الكهرباء</Label>
                    <Input id="elecMeter" dir="ltr" value={electricityMeterNumber} onChange={(e) => setElectricityMeterNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="elecMeterBilledTo">فاتورة الكهرباء على</Label>
                    <Select id="elecMeterBilledTo" value={electricityMeterBilledTo} onChange={(e) => setElectricityMeterBilledTo(e.target.value as MeterBilledTo)}>
                      {METER_BILLED_TO.map((m) => <option key={m} value={m}>{m}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="waterMeter">رقم عداد المياه</Label>
                    <Input id="waterMeter" dir="ltr" value={waterMeterNumber} onChange={(e) => setWaterMeterNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="waterMeterBilledTo">فاتورة المياه على</Label>
                    <Select id="waterMeterBilledTo" value={waterMeterBilledTo} onChange={(e) => setWaterMeterBilledTo(e.target.value as MeterBilledTo)}>
                      {METER_BILLED_TO.map((m) => <option key={m} value={m}>{m}</option>)}
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>إضافة وحدة</CardTitle>
                  <CardSubtitle>الوحدات اختيارية — يمكنك حفظ العقار بدون أي وحدة</CardSubtitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input placeholder="رقم الوحدة / اسمها" value={unitDraft.unitNumber} onChange={(e) => setUnitDraft((f) => ({ ...f, unitNumber: e.target.value }))} />
                  <Select value={unitDraft.type} onChange={(e) => setUnitDraft((f) => ({ ...f, type: e.target.value as UnitType }))}>
                    {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <Input type="number" placeholder="الطابق" value={unitDraft.floor} onChange={(e) => setUnitDraft((f) => ({ ...f, floor: e.target.value }))} />
                  <Input type="number" placeholder="المساحة (م²)" value={unitDraft.area} onChange={(e) => setUnitDraft((f) => ({ ...f, area: e.target.value }))} />
                  <Input type="number" placeholder="غرف النوم" value={unitDraft.bedrooms} onChange={(e) => setUnitDraft((f) => ({ ...f, bedrooms: e.target.value }))} />
                  <Input type="number" placeholder="دورات المياه" value={unitDraft.bathrooms} onChange={(e) => setUnitDraft((f) => ({ ...f, bathrooms: e.target.value }))} />
                  <Input type="number" placeholder="السعر (﷼)" value={unitDraft.price} onChange={(e) => setUnitDraft((f) => ({ ...f, price: e.target.value }))} />
                  <Select value={unitDraft.listingType} onChange={(e) => setUnitDraft((f) => ({ ...f, listingType: e.target.value as "إيجار" | "بيع" }))}>
                    <option value="إيجار">إيجار</option>
                    <option value="بيع">بيع</option>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={unitDraft.furnished} onChange={(e) => setUnitDraft((f) => ({ ...f, furnished: e.target.checked }))} className="h-4 w-4 rounded border-border accent-brand-600" />
                    مؤثثة / مفروشة
                  </label>
                  {unitDraft.furnished && (
                    <Select className="w-40" value={unitDraft.furnitureCondition} onChange={(e) => setUnitDraft((f) => ({ ...f, furnitureCondition: e.target.value as "جديد" | "مستخدم" }))}>
                      <option value="جديد">أثاث جديد</option>
                      <option value="مستخدم">أثاث مستخدم</option>
                    </Select>
                  )}
                </div>

                <div>
                  <Label className="mb-2">العدادات (اختياري)</Label>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Input placeholder="رقم عداد الكهرباء" dir="ltr" value={unitDraft.electricityMeterNumber} onChange={(e) => setUnitDraft((f) => ({ ...f, electricityMeterNumber: e.target.value }))} />
                    <Select value={unitDraft.electricityMeterBilledTo} onChange={(e) => setUnitDraft((f) => ({ ...f, electricityMeterBilledTo: e.target.value as MeterBilledTo }))}>
                      {METER_BILLED_TO.map((m) => <option key={m} value={m}>فاتورة الكهرباء على {m}</option>)}
                    </Select>
                    <Input placeholder="رقم عداد المياه" dir="ltr" value={unitDraft.waterMeterNumber} onChange={(e) => setUnitDraft((f) => ({ ...f, waterMeterNumber: e.target.value }))} />
                    <Select value={unitDraft.waterMeterBilledTo} onChange={(e) => setUnitDraft((f) => ({ ...f, waterMeterBilledTo: e.target.value as MeterBilledTo }))}>
                      {METER_BILLED_TO.map((m) => <option key={m} value={m}>فاتورة المياه على {m}</option>)}
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2">مرافق الوحدة</Label>
                  <p className="text-xs text-muted mb-2">تحديد المرافق المتاحة في هذه الوحدة</p>
                  {amenitiesMode === null && (
                    <div className="flex items-center gap-2 rounded-xl bg-warning-50 border border-warning-200 px-4 py-2.5 text-xs font-semibold text-warning-700 mb-3">
                      يجب اختيار واحد على الأقل
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setAmenitiesMode("none")}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold text-right transition-colors ${amenitiesMode === "none" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-muted hover:bg-background"}`}
                    >
                      لا يوجد مرافق
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmenitiesMode("has")}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold text-right transition-colors ${amenitiesMode === "has" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-muted hover:bg-background"}`}
                    >
                      يوجد مرافق
                    </button>
                  </div>
                  {amenitiesMode === "has" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {UNIT_AMENITIES.map((a) => {
                        const Icon = AMENITY_ICONS[a];
                        const selected = unitDraft.amenities.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleAmenity(a)}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${selected ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-muted hover:bg-background"}`}
                          >
                            {a}
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-3">
                  <div className="w-32">
                    <Label htmlFor="copyCount">عدد النسخ</Label>
                    <Input id="copyCount" type="number" min={1} value={copyCount} onChange={(e) => setCopyCount(e.target.value)} />
                  </div>
                  <Button type="button" onClick={handleAddUnit} disabled={!unitDraft.unitNumber.trim() || amenitiesMode === null}>
                    <Copy size={15} /> {Number(copyCount) > 1 ? `إضافة ${copyCount} نسخة` : "إضافة للقائمة"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {units.length > 0 && (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>الوحدات المضافة</CardTitle>
                    <CardSubtitle>{units.length} وحدة</CardSubtitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {units.map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                        <span className="font-semibold">{u.unitNumber}</span>
                        <span className="text-muted">{u.type}</span>
                        <span className="text-muted">{u.area || 0} م²</span>
                        <button type="button" onClick={() => removeUnit(u.id)} className="text-danger-500 hover:text-danger-700">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}>
            <ArrowRight size={15} /> السابق
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              disabled={(step === 1 && !canGoStep1) || (step === 2 && !canGoStep2) || (step === 3 && !canGoStep3)}
            >
              التالي <ArrowLeft size={15} />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "جارِ الحفظ..." : "حفظ العقار"}
            </Button>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
