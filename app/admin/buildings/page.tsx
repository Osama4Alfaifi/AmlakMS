"use client";

import { Fragment, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { currency } from "@/lib/mock-data";
import { useOwnerBuildings, useOwnerUnits, useOwners } from "@/lib/firestore/hooks";
import { createBuilding, createUnit } from "@/lib/firestore/mutations";
import type { PropertyStatus, PropertyType, Unit } from "@/lib/types";
import { Building2, ChevronDown, ChevronUp, DoorClosed, Plus } from "lucide-react";

const UNIT_TYPES: PropertyType[] = ["شقة", "فيلا", "محل تجاري", "مكتب", "أرض", "استراحة"];
const UNIT_STATUSES: PropertyStatus[] = ["متاحة", "مؤجرة", "مباعة", "تحت الصيانة"];

function emptyUnitForm() {
  return {
    unitNumber: "",
    floor: "",
    type: "شقة" as PropertyType,
    area: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
    listingType: "إيجار" as "إيجار" | "بيع",
    status: "متاحة" as PropertyStatus,
  };
}

export default function AdminBuildingsPage() {
  const scope = useAccountantOwnerScope();
  const { data: buildings } = useOwnerBuildings(scope.queryOwnerId);
  const { data: units } = useOwnerUnits(scope.queryOwnerId);
  const { data: owners } = useOwners();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [submittingBuilding, setSubmittingBuilding] = useState(false);
  const [buildingForm, setBuildingForm] = useState({ name: "", city: "", district: "", address: "", ownerId: "", notes: "" });

  const [unitForm, setUnitForm] = useState(emptyUnitForm());
  const [submittingUnit, setSubmittingUnit] = useState(false);

  const unitsByBuilding = useMemo(() => {
    const map = new Map<string, Unit[]>();
    units.forEach((u) => map.set(u.buildingId, [...(map.get(u.buildingId) ?? []), u]));
    return map;
  }, [units]);

  async function handleCreateBuilding(e: React.FormEvent) {
    e.preventDefault();
    if (!buildingForm.name.trim() || !buildingForm.ownerId) return;
    setSubmittingBuilding(true);
    await createBuilding({
      name: buildingForm.name,
      city: buildingForm.city,
      district: buildingForm.district,
      address: buildingForm.address,
      ownerId: buildingForm.ownerId,
      notes: buildingForm.notes || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmittingBuilding(false);
    setShowBuildingForm(false);
    setBuildingForm({ name: "", city: "", district: "", address: "", ownerId: "", notes: "" });
  }

  async function handleCreateUnit(e: React.FormEvent, buildingId: string, ownerId: string) {
    e.preventDefault();
    if (!unitForm.unitNumber.trim() || !unitForm.price) return;
    setSubmittingUnit(true);
    await createUnit({
      buildingId,
      ownerId,
      unitNumber: unitForm.unitNumber,
      floor: Number(unitForm.floor) || 0,
      type: unitForm.type,
      area: Number(unitForm.area) || 0,
      bedrooms: Number(unitForm.bedrooms) || 0,
      bathrooms: Number(unitForm.bathrooms) || 0,
      price: Number(unitForm.price),
      listingType: unitForm.listingType,
      status: unitForm.status,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmittingUnit(false);
    setUnitForm(emptyUnitForm());
  }

  return (
    <DashboardShell allow={["admin", "accountant"]} title="المباني والوحدات">
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="عدد المباني" value={String(buildings.length)} icon={Building2} tone="brand" />
          <StatCard label="عدد الوحدات" value={String(units.length)} icon={DoorClosed} tone="info" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>المباني</CardTitle>
              <CardSubtitle>
                {buildings.length} مبنى
                {!scope.isAccountant && " — اضغط على أي صف لعرض وحداته وإضافة وحدة جديدة"}
                {scope.isAccountant && " — اضغط على أي صف لعرض وحداته"}
              </CardSubtitle>
            </div>
            {!scope.isAccountant && (
              <Button size="sm" onClick={() => setShowBuildingForm((v) => !v)}>
                <Plus size={15} /> مبنى جديد
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th></Th>
                  <Th>المبنى</Th>
                  <Th>المدينة / الحي</Th>
                  <Th>المالك</Th>
                  <Th>عدد الوحدات</Th>
                </Tr>
              </THead>
              <TBody>
                {buildings.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-muted py-6">لا توجد مبانٍ مسجّلة بعد</Td>
                  </Tr>
                )}
                {buildings.map((b) => {
                  const isOpen = expandedId === b.id;
                  const buildingUnits = unitsByBuilding.get(b.id) ?? [];
                  // Units don't carry real contracts/payments (unlike Property) — this
                  // is a listed-rent estimate (annual price ÷ 12), not collected income.
                  const rentedUnits = buildingUnits.filter((u) => u.listingType === "إيجار" && u.status === "مؤجرة");
                  const annualIncome = rentedUnits.reduce((s, u) => s + u.price, 0);
                  const monthlyIncome = annualIncome / 12;
                  return (
                    <Fragment key={b.id}>
                      <Tr className="cursor-pointer" onClick={() => setExpandedId(isOpen ? null : b.id)}>
                        <Td className="w-8 text-muted">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Td>
                        <Td className="font-semibold">{b.name}</Td>
                        <Td className="text-muted">{b.city} · {b.district}</Td>
                        <Td className="text-muted">{owners.find((o) => o.id === b.ownerId)?.name ?? "—"}</Td>
                        <Td>{buildingUnits.length}</Td>
                      </Tr>
                      {isOpen && (
                        <Tr className="bg-background">
                          <Td colSpan={5} className="py-4 whitespace-normal align-top">
                            <div className="pr-8 flex flex-col gap-4">
                              {buildingUnits.length > 0 && (
                                <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                                  <div className="rounded-xl border border-border p-3">
                                    <p className="text-xs text-muted mb-1">الوحدات المؤجرة</p>
                                    <p className="text-lg font-bold">{rentedUnits.length} <span className="text-sm font-normal text-muted">من {buildingUnits.length}</span></p>
                                  </div>
                                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
                                    <p className="text-xs text-brand-700 mb-1">الدخل الشهري المتوقع</p>
                                    <p className="text-lg font-bold text-brand-700">{currency(monthlyIncome)}</p>
                                  </div>
                                  <div className="rounded-xl border border-border p-3">
                                    <p className="text-xs text-muted mb-1">الدخل السنوي المتوقع</p>
                                    <p className="text-lg font-bold">{currency(annualIncome)}</p>
                                  </div>
                                </div>
                              )}
                              {buildingUnits.length > 0 && (
                                <Table>
                                  <THead>
                                    <Tr>
                                      <Th>الوحدة</Th>
                                      <Th>الطابق</Th>
                                      <Th>النوع</Th>
                                      <Th>المساحة</Th>
                                      <Th>السعر</Th>
                                      <Th>الحالة</Th>
                                    </Tr>
                                  </THead>
                                  <TBody>
                                    {buildingUnits.map((u) => (
                                      <Tr key={u.id}>
                                        <Td className="font-semibold">{u.unitNumber}</Td>
                                        <Td className="text-muted">{u.floor}</Td>
                                        <Td>{u.type}</Td>
                                        <Td>{u.area} م²</Td>
                                        <Td className="font-semibold">{currency(u.price)}</Td>
                                        <Td><Badge>{u.status}</Badge></Td>
                                      </Tr>
                                    ))}
                                  </TBody>
                                </Table>
                              )}
                              {!scope.isAccountant && (
                                <form onSubmit={(e) => handleCreateUnit(e, b.id, b.ownerId)} className="grid sm:grid-cols-4 gap-3 max-w-3xl">
                                  <Input placeholder="رقم الوحدة" value={unitForm.unitNumber} onChange={(e) => setUnitForm((f) => ({ ...f, unitNumber: e.target.value }))} required />
                                  <Input type="number" placeholder="الطابق" value={unitForm.floor} onChange={(e) => setUnitForm((f) => ({ ...f, floor: e.target.value }))} />
                                  <Select value={unitForm.type} onChange={(e) => setUnitForm((f) => ({ ...f, type: e.target.value as PropertyType }))}>
                                    {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                  </Select>
                                  <Input type="number" placeholder="المساحة (م²)" value={unitForm.area} onChange={(e) => setUnitForm((f) => ({ ...f, area: e.target.value }))} />
                                  <Input type="number" placeholder="غرف النوم" value={unitForm.bedrooms} onChange={(e) => setUnitForm((f) => ({ ...f, bedrooms: e.target.value }))} />
                                  <Input type="number" placeholder="دورات المياه" value={unitForm.bathrooms} onChange={(e) => setUnitForm((f) => ({ ...f, bathrooms: e.target.value }))} />
                                  <Input type="number" placeholder="السعر (﷼)" value={unitForm.price} onChange={(e) => setUnitForm((f) => ({ ...f, price: e.target.value }))} required />
                                  <Select value={unitForm.listingType} onChange={(e) => setUnitForm((f) => ({ ...f, listingType: e.target.value as "إيجار" | "بيع" }))}>
                                    <option value="إيجار">إيجار</option>
                                    <option value="بيع">بيع</option>
                                  </Select>
                                  <Select value={unitForm.status} onChange={(e) => setUnitForm((f) => ({ ...f, status: e.target.value as PropertyStatus }))}>
                                    {UNIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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

        {showBuildingForm && (
          <Card>
            <CardHeader>
              <CardTitle>مبنى جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBuilding} className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bname">اسم المبنى</Label>
                  <Input id="bname" value={buildingForm.name} onChange={(e) => setBuildingForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="bowner">المالك</Label>
                  <Select id="bowner" value={buildingForm.ownerId} onChange={(e) => setBuildingForm((f) => ({ ...f, ownerId: e.target.value }))} required>
                    <option value="" disabled>اختر مالكًا</option>
                    {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bcity">المدينة</Label>
                  <Input id="bcity" value={buildingForm.city} onChange={(e) => setBuildingForm((f) => ({ ...f, city: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="bdistrict">الحي</Label>
                  <Input id="bdistrict" value={buildingForm.district} onChange={(e) => setBuildingForm((f) => ({ ...f, district: e.target.value }))} required />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="baddress">العنوان</Label>
                  <Input id="baddress" value={buildingForm.address} onChange={(e) => setBuildingForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="bnotes">ملاحظات</Label>
                  <Input id="bnotes" value={buildingForm.notes} onChange={(e) => setBuildingForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button type="submit" disabled={submittingBuilding} className="sm:col-span-3 self-start">
                  {submittingBuilding ? "جارِ الحفظ..." : "حفظ المبنى"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
