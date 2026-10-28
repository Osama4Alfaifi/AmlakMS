"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Label, Select } from "@/components/ui/Input";
import { currency } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { useOwnerProperties } from "@/lib/firestore/hooks";

const PropertyMap = dynamic(() => import("@/components/map/PropertyMap").then((m) => m.PropertyMap), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-muted text-sm">جارِ تحميل الخريطة...</div>
  ),
});

export default function MapPage() {
  const { user, ready } = useAuth();
  // Query-level scoping (matches firestore.rules): an owner's query is
  // constrained to their own ownerId; admin/leasingAgent pass null for the
  // unconstrained fetch their broader access is entitled to. Gating the
  // unconstrained branch on `ready` (not just role) matters here — this
  // component's hooks run before DashboardShell's own ready-check takes
  // effect, so an eventual owner would otherwise briefly fire an
  // unconstrained query (denied by firestore.rules) during the render(s)
  // before their role is known.
  const ownerScopedId = !ready ? undefined : user?.role === "owner" ? user.linkedId ?? undefined : null;
  const { data: properties } = useOwnerProperties(ownerScopedId);
  const [city, setCity] = useState("الكل");
  const [type, setType] = useState("الكل");
  const [status, setStatus] = useState("الكل");

  const cities = ["الكل", ...Array.from(new Set(properties.map((p) => p.city)))];
  const types = ["الكل", ...Array.from(new Set(properties.map((p) => p.type)))];
  const statuses = ["الكل", ...Array.from(new Set(properties.map((p) => p.status)))];

  const filtered = useMemo(
    () =>
      properties.filter(
        (p) =>
          (city === "الكل" || p.city === city) &&
          (type === "الكل" || p.type === type) &&
          (status === "الكل" || p.status === status)
      ),
    [properties, city, type, status]
  );

  return (
    <DashboardShell allow={["admin", "leasingAgent"]} title="الخريطة التفاعلية">
      <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start h-[calc(100vh-8rem)]">
        <Card className="h-full overflow-y-auto">
          <CardHeader>
            <div>
              <CardTitle>فلاتر البحث</CardTitle>
              <CardSubtitle>{filtered.length} من {properties.length} عقار</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label htmlFor="city">المدينة</Label>
              <Select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="type">نوع العقار</Label>
              <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">الحالة</Label>
              <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>

            <div className="border-t border-border pt-4 flex flex-col gap-2 max-h-72 overflow-y-auto">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-xl border border-border p-3">
                  <p className="text-xs font-bold truncate">{p.title}</p>
                  <p className="text-[11px] text-muted mt-0.5">{p.city} · {p.district}</p>
                  <p className="text-xs font-semibold text-brand-700 mt-1">{currency(p.price)}</p>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-xs text-muted text-center py-4">لا توجد نتائج مطابقة</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden p-0">
          <div className="h-full">
            <PropertyMap properties={filtered} />
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
