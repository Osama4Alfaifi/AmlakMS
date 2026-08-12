"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { useAuth } from "@/lib/auth-context";
import { currency } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { downloadExcel } from "@/lib/excel";
import { useOwnerProperties, useOwners } from "@/lib/firestore/hooks";
import { createProperty } from "@/lib/firestore/mutations";
import type { PropertyStatus, PropertyType } from "@/lib/types";
import { Download, FileSpreadsheet, Plus, Search } from "lucide-react";

const PROPERTY_TYPES: PropertyType[] = ["شقة", "فيلا", "محل تجاري", "مكتب", "أرض", "استراحة"];
const PROPERTY_STATUSES: PropertyStatus[] = ["متاحة", "مؤجرة", "مباعة", "تحت الصيانة"];
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
    price: "",
    listingType: "إيجار" as "إيجار" | "بيع",
    status: "متاحة" as PropertyStatus,
    ownerId: "",
    lat: String(DEFAULT_LAT),
    lng: String(DEFAULT_LNG),
  };
}

export default function AdminPropertiesPage() {
  const { user } = useAuth();
  const scope = useAccountantOwnerScope();
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: owners } = useOwners();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("الكل");
  const cities = ["الكل", ...Array.from(new Set(properties.map((p) => p.city)))];
  const canCreate = user?.role === "admin" || user?.role === "leasingAgent";

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyPropertyForm());

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.city.trim() || !form.ownerId || !Number(form.price)) return;
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
      price: Number(form.price),
      listingType: form.listingType,
      status: form.status,
      ownerId: form.ownerId,
      lat: Number(form.lat) || DEFAULT_LAT,
      lng: Number(form.lng) || DEFAULT_LNG,
      color: MARKER_COLORS[properties.length % MARKER_COLORS.length],
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setShowForm(false);
    setForm(emptyPropertyForm());
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
    <DashboardShell allow={["admin", "leasingAgent", "accountant"]} title="العقارات">
      <div className="flex flex-col gap-6">
        <Card>
        <CardHeader>
          <div>
            <CardTitle>جميع العقارات</CardTitle>
            <CardSubtitle>{properties.length} عقار مُدار عبر المنصة</CardSubtitle>
          </div>
          <div className="flex items-center gap-2">
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
            {canCreate && (
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> عقار جديد
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <Tr>
                <Th>العقار</Th>
                <Th>النوع</Th>
                <Th>المدينة / الحي</Th>
                <Th>المساحة</Th>
                <Th>السعر</Th>
                <Th>المالك</Th>
                <Th>الحالة</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-semibold">{p.title}</Td>
                  <Td>{p.type}</Td>
                  <Td className="text-muted">{p.city} · {p.district}</Td>
                  <Td>{p.area} م²</Td>
                  <Td className="font-semibold">{currency(p.price)}{p.listingType === "إيجار" && <span className="text-muted font-normal">/سنويًا</span>}</Td>
                  <Td className="text-muted">{owners.find((o) => o.id === p.ownerId)?.name}</Td>
                  <Td><Badge>{p.status}</Badge></Td>
                </Tr>
              ))}
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
                <div>
                  <Label htmlFor="pprice">السعر (﷼)</Label>
                  <Input id="pprice" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="plistingtype">نوع العرض</Label>
                  <Select id="plistingtype" value={form.listingType} onChange={(e) => setForm((f) => ({ ...f, listingType: e.target.value as "إيجار" | "بيع" }))}>
                    <option value="إيجار">إيجار</option>
                    <option value="بيع">بيع</option>
                  </Select>
                </div>
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
