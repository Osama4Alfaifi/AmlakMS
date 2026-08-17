"use client";

import { Fragment, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { useAuth } from "@/lib/auth-context";
import { currency } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { downloadExcel } from "@/lib/excel";
import { useCustomRole, useOwnerProperties, useOwnerUnits, useOwners } from "@/lib/firestore/hooks";
import { createProperty, createUnit, deleteUnit, updateProperty, updateUnit } from "@/lib/firestore/mutations";
import type { MeterBilledTo, PropertyStatus, PropertyType, Unit, UnitType } from "@/lib/types";
import { UNIT_TYPES } from "@/lib/types";
import { Check, ChevronDown, ChevronUp, Download, FileSpreadsheet, Pencil, Plus, Search, Trash2, X } from "lucide-react";

const PROPERTY_TYPES: PropertyType[] = [
  "شقة", "فيلا", "محل تجاري", "مكتب", "أرض", "استراحة", "غرفة عزاب",
  "عمارة", "مجمع تجاري مفتوح", "مجمع تجاري مغلق", "برج", "أخرى",
];
const PROPERTY_STATUSES: PropertyStatus[] = ["متاحة", "مؤجرة", "مباعة", "تحت الصيانة"];
const METER_BILLED_TO: MeterBilledTo[] = ["المالك", "المستأجر"];

function emptyUnitForm() {
  return {
    unitNumber: "",
    floor: "",
    type: "غرفة عزاب" as UnitType,
    area: "",
    bedrooms: "",
    bathrooms: "",
    status: "متاحة" as PropertyStatus,
    electricityMeterNumber: "",
    electricityMeterBilledTo: "المستأجر" as MeterBilledTo,
    waterMeterNumber: "",
    waterMeterBilledTo: "المستأجر" as MeterBilledTo,
  };
}
// Rotates through the map's existing marker palette (see lib/mock-data.ts)
// instead of asking the leasing agent to pick a color for every listing.
const MARKER_COLORS = ["#3563f4", "#1fa35c", "#e0a318", "#dc3b3b", "#2196d8", "#1c3ab3"];
// Riyadh city-center default — still editable, since there's no map picker.
const DEFAULT_LAT = 24.7136;
const DEFAULT_LNG = 46.6753;

function emptyPropertyForm() {
  return {
    title: "",
    type: "شقة" as PropertyType,
    city: "",
    district: "",
    address: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    status: "متاحة" as PropertyStatus,
    ownerId: "",
    lat: String(DEFAULT_LAT),
    lng: String(DEFAULT_LNG),
    managementEndDate: "",
    hasBroker: false,
    brokerName: "",
    brokerPhone: "",
    electricityMeterNumber: "",
    electricityMeterBilledTo: "المستأجر" as MeterBilledTo,
    waterMeterNumber: "",
    waterMeterBilledTo: "المستأجر" as MeterBilledTo,
  };
}

export default function AdminPropertiesPage() {
  const { user } = useAuth();
  const scope = useAccountantOwnerScope();
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: units } = useOwnerUnits(scope.queryOwnerId);
  const { data: owners } = useOwners();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("الكل");
  const cities = ["الكل", ...Array.from(new Set(properties.map((p) => p.city)))];
  const customRole = useCustomRole(user?.role === "custom" ? user.customRoleId : undefined);
  const canCreate = user?.role === "admin" || user?.role === "leasingAgent" || !!customRole?.permissions?.properties?.write;

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyPropertyForm());

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState(emptyUnitForm());
  const [submittingUnit, setSubmittingUnit] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitEditDraft, setUnitEditDraft] = useState({ unitNumber: "" });

  const unitsByProperty = useMemo(() => {
    const map = new Map<string, Unit[]>();
    units.forEach((u) => map.set(u.propertyId, [...(map.get(u.propertyId) ?? []), u]));
    return map;
  }, [units]);

  async function handleCreateUnit(e: React.FormEvent, propertyId: string, ownerId: string) {
    e.preventDefault();
    if (!unitForm.unitNumber.trim()) return;
    setSubmittingUnit(true);
    await createUnit({
      propertyId,
      ownerId,
      unitNumber: unitForm.unitNumber,
      floor: Number(unitForm.floor) || 0,
      type: unitForm.type,
      area: Number(unitForm.area) || 0,
      bedrooms: Number(unitForm.bedrooms) || 0,
      bathrooms: Number(unitForm.bathrooms) || 0,
      // Price/listing type are set later from "العروض" (see
      // app/admin/listings) — a unit is just inventory at intake.
      price: 0,
      listingType: "إيجار",
      status: unitForm.status,
      createdAt: new Date().toISOString().slice(0, 10),
      electricityMeterNumber: unitForm.electricityMeterNumber || undefined,
      electricityMeterBilledTo: unitForm.electricityMeterNumber ? unitForm.electricityMeterBilledTo : undefined,
      waterMeterNumber: unitForm.waterMeterNumber || undefined,
      waterMeterBilledTo: unitForm.waterMeterNumber ? unitForm.waterMeterBilledTo : undefined,
    });
    setSubmittingUnit(false);
    setUnitForm(emptyUnitForm());
  }

  async function handleUnitStatusChange(id: string, status: PropertyStatus) {
    await updateUnit(id, { status });
  }

  function startEditUnit(u: Unit) {
    setEditingUnitId(u.id);
    setUnitEditDraft({ unitNumber: u.unitNumber });
  }

  function cancelEditUnit() {
    setEditingUnitId(null);
  }

  async function saveEditUnit(id: string) {
    if (!unitEditDraft.unitNumber.trim()) return;
    await updateUnit(id, { unitNumber: unitEditDraft.unitNumber });
    setEditingUnitId(null);
  }

  async function handleDeleteUnit(u: Unit) {
    if (!confirm(`هل تريد حذف الوحدة "${u.unitNumber}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    await deleteUnit(u.id, u.unitNumber);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.city.trim() || !form.ownerId) return;
    setSubmitting(true);
    await createProperty({
      title: form.title,
      type: form.type,
      city: form.city,
      district: form.district,
      address: form.address,
      area: Number(form.area) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      // Price/listing type live on each unit now, not the property itself.
      price: 0,
      listingType: "إيجار",
      status: form.status,
      ownerId: form.ownerId,
      lat: Number(form.lat) || DEFAULT_LAT,
      lng: Number(form.lng) || DEFAULT_LNG,
      color: MARKER_COLORS[properties.length % MARKER_COLORS.length],
      createdAt: new Date().toISOString().slice(0, 10),
      managementEndDate: form.managementEndDate || undefined,
      hasBroker: form.hasBroker,
      brokerName: form.hasBroker ? form.brokerName || undefined : undefined,
      brokerPhone: form.hasBroker ? form.brokerPhone || undefined : undefined,
      electricityMeterNumber: form.electricityMeterNumber || undefined,
      electricityMeterBilledTo: form.electricityMeterNumber ? form.electricityMeterBilledTo : undefined,
      waterMeterNumber: form.waterMeterNumber || undefined,
      waterMeterBilledTo: form.waterMeterNumber ? form.waterMeterBilledTo : undefined,
    });
    setSubmitting(false);
    setShowForm(false);
    setForm(emptyPropertyForm());
  }

  async function handleStatusChange(id: string, status: PropertyStatus) {
    await updateProperty(id, { status });
  }

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) => (city === "الكل" || p.city === city) && (p.title.includes(query) || p.district.includes(query))
      ),
    [properties, query, city]
  );

  const exportRows = () =>
    filtered.map((p) => ({
      العقار: p.title,
      النوع: p.type,
      المدينة: p.city,
      الحي: p.district,
      المساحة: p.area,
      السعر: p.price,
      المالك: owners.find((o) => o.id === p.ownerId)?.name ?? "",
      الحالة: p.status,
    }));

  return (
    <DashboardShell allow={["admin", "leasingAgent", "accountant", "custom"]} customResource="properties" title="العقارات">
      <div className="flex flex-col gap-6">
        <Card>
        <CardHeader>
          <div>
            <CardTitle>جميع العقارات</CardTitle>
            <CardSubtitle>{properties.length} عقار مُدار عبر المنصة</CardSubtitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={city} onChange={(e) => setCity(e.target.value)} className="w-36">
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <div className="relative w-52">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
            </div>
            <Button size="sm" variant="outline" onClick={() => downloadCsv("العقارات", exportRows())}>
              <Download size={15} /> تصدير CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadExcel("العقارات", "العقارات", exportRows())}>
              <FileSpreadsheet size={15} /> تصدير Excel
            </Button>
            {canCreate && user?.role === "leasingAgent" ? (
              <LinkButton href="/admin/properties/new" size="sm">
                <Plus size={15} /> عقار جديد
              </LinkButton>
            ) : (
              canCreate && (
                <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                  <Plus size={15} /> عقار جديد
                </Button>
              )
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th></Th>
                <Th>العقار</Th>
                <Th>النوع</Th>
                <Th>المدينة / الحي</Th>
                <Th>المساحة</Th>
                <Th>السعر</Th>
                <Th>المالك</Th>
                <Th>الحالة</Th>
                <Th>انتهاء الإدارة</Th>
                <Th>الوحدات</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((p) => {
                const isOpen = expandedId === p.id;
                const propertyUnits = unitsByProperty.get(p.id) ?? [];
                return (
                  <Fragment key={p.id}>
                    <Tr className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : p.id)}>
                      <Td className="w-8 text-muted">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Td>
                      <Td className="font-semibold">{p.title}</Td>
                      <Td>{p.type}</Td>
                      <Td className="text-muted">{p.city} · {p.district}</Td>
                      <Td>{p.area} م²</Td>
                      <Td className="font-semibold">{currency(p.price)}{p.listingType === "إيجار" && <span className="text-muted font-normal">/سنويًا</span>}</Td>
                      <Td className="text-muted">{owners.find((o) => o.id === p.ownerId)?.name}</Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        {canCreate ? (
                          <Select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value as PropertyStatus)}
                            className="w-32 py-1.5 text-xs"
                          >
                            {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        ) : (
                          <Badge>{p.status}</Badge>
                        )}
                      </Td>
                      <Td className="text-muted">{p.managementEndDate ?? "—"}</Td>
                      <Td className="text-muted">{propertyUnits.length || "—"}</Td>
                    </Tr>
                    {isOpen && (
                      <Tr className="bg-background">
                        <Td colSpan={10} className="py-4 whitespace-normal align-top">
                          <div className="pr-8 flex flex-col gap-4">
                            {(p.deedType || p.region || p.street || p.usage || p.propertyNumber || p.coOwners?.length || p.electricityMeterNumber || p.waterMeterNumber) && (
                              <div className="rounded-xl border border-border bg-surface p-4">
                                <p className="text-xs font-bold text-muted mb-2">تفاصيل إضافية</p>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                                  {p.deedType && <div><span className="text-muted">نوع الصك: </span>{p.deedType}</div>}
                                  {p.deedIssueDate && <div><span className="text-muted">تاريخ الإصدار: </span>{p.deedIssueDate}</div>}
                                  {p.usage && <div><span className="text-muted">الاستخدام: </span>{p.usage}</div>}
                                  {p.propertyNumber && <div><span className="text-muted">رقم العقار: </span>{p.propertyNumber}</div>}
                                  {p.region && <div><span className="text-muted">المنطقة: </span>{p.region}</div>}
                                  {p.street && <div><span className="text-muted">الشارع: </span>{p.street}</div>}
                                  {p.buildingNumber && <div><span className="text-muted">رقم المبنى: </span>{p.buildingNumber}</div>}
                                  {p.subNumber && <div><span className="text-muted">الرقم الفرعي: </span>{p.subNumber}</div>}
                                  {p.postalCode && <div><span className="text-muted">الرمز البريدي: </span>{p.postalCode}</div>}
                                  {p.electricityMeterNumber && <div><span className="text-muted">عداد الكهرباء: </span>{p.electricityMeterNumber} ({p.electricityMeterBilledTo})</div>}
                                  {p.waterMeterNumber && <div><span className="text-muted">عداد المياه: </span>{p.waterMeterNumber} ({p.waterMeterBilledTo})</div>}
                                </div>
                                {!!p.coOwners?.length && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs font-bold text-muted mb-2">ملاك إضافيون</p>
                                    <div className="flex flex-wrap gap-2">
                                      {p.coOwners.map((c, i) => (
                                        <span key={i} className="rounded-lg bg-background px-2.5 py-1 text-xs">
                                          {c.name}{c.phone ? ` · ${c.phone}` : ""}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {propertyUnits.length > 0 && (
                              <Table>
                                <THead>
                                  <Tr>
                                    <Th>الوحدة</Th>
                                    <Th>الطابق</Th>
                                    <Th>النوع</Th>
                                    <Th>المساحة</Th>
                                    <Th>عداد الكهرباء</Th>
                                    <Th>عداد المياه</Th>
                                    <Th>الحالة</Th>
                                    {canCreate && <Th></Th>}
                                  </Tr>
                                </THead>
                                <TBody>
                                  {propertyUnits.map((u) => {
                                    const isEditing = editingUnitId === u.id;
                                    return (
                                      <Tr key={u.id}>
                                        <Td className="font-semibold">
                                          {isEditing ? (
                                            <Input
                                              value={unitEditDraft.unitNumber}
                                              onChange={(e) => setUnitEditDraft((d) => ({ ...d, unitNumber: e.target.value }))}
                                              className="w-28 py-1.5 text-xs"
                                            />
                                          ) : (
                                            u.unitNumber
                                          )}
                                        </Td>
                                        <Td className="text-muted">{u.floor}</Td>
                                        <Td>{u.type}</Td>
                                        <Td>{u.area} م²</Td>
                                        <Td className="text-muted">{u.electricityMeterNumber ? `${u.electricityMeterNumber} (${u.electricityMeterBilledTo})` : "—"}</Td>
                                        <Td className="text-muted">{u.waterMeterNumber ? `${u.waterMeterNumber} (${u.waterMeterBilledTo})` : "—"}</Td>
                                        <Td>
                                          {canCreate ? (
                                            <Select
                                              value={u.status}
                                              onChange={(e) => handleUnitStatusChange(u.id, e.target.value as PropertyStatus)}
                                              className="w-32 py-1.5 text-xs"
                                            >
                                              {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </Select>
                                          ) : (
                                            <Badge>{u.status}</Badge>
                                          )}
                                        </Td>
                                        {canCreate && (
                                          <Td>
                                            {isEditing ? (
                                              <div className="flex items-center gap-1">
                                                <button type="button" onClick={() => saveEditUnit(u.id)} className="text-success-600 hover:text-success-700" title="حفظ">
                                                  <Check size={15} />
                                                </button>
                                                <button type="button" onClick={cancelEditUnit} className="text-muted hover:text-foreground" title="إلغاء">
                                                  <X size={15} />
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => startEditUnit(u)} className="text-muted hover:text-foreground" title="تعديل">
                                                  <Pencil size={14} />
                                                </button>
                                                <button type="button" onClick={() => handleDeleteUnit(u)} className="text-danger-500 hover:text-danger-700" title="حذف">
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                            )}
                                          </Td>
                                        )}
                                      </Tr>
                                    );
                                  })}
                                </TBody>
                              </Table>
                            )}
                            {canCreate && (
                              <form onSubmit={(e) => handleCreateUnit(e, p.id, p.ownerId)} className="grid sm:grid-cols-4 gap-3 max-w-3xl">
                                <Input placeholder="رقم الوحدة" value={unitForm.unitNumber} onChange={(e) => setUnitForm((f) => ({ ...f, unitNumber: e.target.value }))} required />
                                <Input type="number" placeholder="الطابق" value={unitForm.floor} onChange={(e) => setUnitForm((f) => ({ ...f, floor: e.target.value }))} />
                                <Select value={unitForm.type} onChange={(e) => setUnitForm((f) => ({ ...f, type: e.target.value as UnitType }))}>
                                  {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </Select>
                                <Input type="number" placeholder="المساحة (م²)" value={unitForm.area} onChange={(e) => setUnitForm((f) => ({ ...f, area: e.target.value }))} />
                                <Input type="number" placeholder="غرف النوم" value={unitForm.bedrooms} onChange={(e) => setUnitForm((f) => ({ ...f, bedrooms: e.target.value }))} />
                                <Input type="number" placeholder="دورات المياه" value={unitForm.bathrooms} onChange={(e) => setUnitForm((f) => ({ ...f, bathrooms: e.target.value }))} />
                                <Select value={unitForm.status} onChange={(e) => setUnitForm((f) => ({ ...f, status: e.target.value as PropertyStatus }))}>
                                  {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </Select>
                                <Input placeholder="رقم عداد الكهرباء" dir="ltr" value={unitForm.electricityMeterNumber} onChange={(e) => setUnitForm((f) => ({ ...f, electricityMeterNumber: e.target.value }))} />
                                <Select value={unitForm.electricityMeterBilledTo} onChange={(e) => setUnitForm((f) => ({ ...f, electricityMeterBilledTo: e.target.value as MeterBilledTo }))}>
                                  {METER_BILLED_TO.map((m) => <option key={m} value={m}>فاتورة الكهرباء على {m}</option>)}
                                </Select>
                                <Input placeholder="رقم عداد المياه" dir="ltr" value={unitForm.waterMeterNumber} onChange={(e) => setUnitForm((f) => ({ ...f, waterMeterNumber: e.target.value }))} />
                                <Select value={unitForm.waterMeterBilledTo} onChange={(e) => setUnitForm((f) => ({ ...f, waterMeterBilledTo: e.target.value as MeterBilledTo }))}>
                                  {METER_BILLED_TO.map((m) => <option key={m} value={m}>فاتورة المياه على {m}</option>)}
                                </Select>
                                <Button type="submit" size="sm" disabled={submittingUnit} className="self-start">
                                  <Plus size={14} /> {submittingUnit ? "جارِ الحفظ..." : "إضافة وحدة"}
                                </Button>
                              </form>
                            )}
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

      {canCreate && showForm && (
        <Card>
          <CardHeader>
            <CardTitle>عقار جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ptitle">اسم العقار</Label>
                  <Input id="ptitle" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="ptype">النوع</Label>
                  <Select id="ptype" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PropertyType }))}>
                    {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="powner">المالك</Label>
                  <Select id="powner" value={form.ownerId} onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))} required>
                    <option value="" disabled>اختر مالكًا</option>
                    {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pcity">المدينة</Label>
                  <Input id="pcity" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="pdistrict">الحي</Label>
                  <Input id="pdistrict" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="paddress">العنوان</Label>
                  <Input id="paddress" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="parea">المساحة (م²)</Label>
                  <Input id="parea" type="number" min={0} value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pbedrooms">غرف النوم</Label>
                  <Input id="pbedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pbathrooms">دورات المياه</Label>
                  <Input id="pbathrooms" type="number" min={0} value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="pstatus">الحالة</Label>
                  <Select id="pstatus" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PropertyStatus }))}>
                    {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plat">خط العرض (Latitude)</Label>
                  <Input id="plat" type="number" step="any" dir="ltr" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="plng">خط الطول (Longitude)</Label>
                  <Input id="plng" type="number" step="any" dir="ltr" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <Label htmlFor="pmgmtend">تاريخ انتهاء عقد الإدارة (اختياري)</Label>
                  <Input
                    id="pmgmtend"
                    type="date"
                    value={form.managementEndDate}
                    onChange={(e) => setForm((f) => ({ ...f, managementEndDate: e.target.value }))}
                  />
                </div>
                <div className="pb-2.5">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.hasBroker}
                      onChange={(e) => setForm((f) => ({ ...f, hasBroker: e.target.checked }))}
                      className="h-4 w-4 rounded border-border accent-brand-600"
                    />
                    عبر وسيط عقاري
                  </label>
                </div>
                {form.hasBroker && (
                  <>
                    <div>
                      <Label htmlFor="pbrokername">اسم الوسيط</Label>
                      <Input id="pbrokername" value={form.brokerName} onChange={(e) => setForm((f) => ({ ...f, brokerName: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="pbrokerphone">جوال الوسيط</Label>
                      <Input id="pbrokerphone" dir="ltr" value={form.brokerPhone} onChange={(e) => setForm((f) => ({ ...f, brokerPhone: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="pelecmeter">رقم عداد الكهرباء</Label>
                  <Input id="pelecmeter" dir="ltr" value={form.electricityMeterNumber} onChange={(e) => setForm((f) => ({ ...f, electricityMeterNumber: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pelecmeterbilledto">فاتورة الكهرباء على</Label>
                  <Select id="pelecmeterbilledto" value={form.electricityMeterBilledTo} onChange={(e) => setForm((f) => ({ ...f, electricityMeterBilledTo: e.target.value as MeterBilledTo }))}>
                    {METER_BILLED_TO.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pwatermeter">رقم عداد المياه</Label>
                  <Input id="pwatermeter" dir="ltr" value={form.waterMeterNumber} onChange={(e) => setForm((f) => ({ ...f, waterMeterNumber: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="pwatermeterbilledto">فاتورة المياه على</Label>
                  <Select id="pwatermeterbilledto" value={form.waterMeterBilledTo} onChange={(e) => setForm((f) => ({ ...f, waterMeterBilledTo: e.target.value as MeterBilledTo }))}>
                    {METER_BILLED_TO.map((m) => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="self-start">
                {submitting ? "جارِ الحفظ..." : "حفظ العقار"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardShell>
  );
}
