"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useAppSettings } from "@/lib/firestore/hooks";
import { updateAppSettings } from "@/lib/firestore/mutations";
import type { AppSettings } from "@/lib/types";
import { Save } from "lucide-react";

function emptyForm(): Omit<AppSettings, "id"> {
  return {
    companyNameAr: "",
    companyNameEn: "",
    email: "",
    address: "",
    city: "",
    phone: "",
    whatsapp: "",
    bankName: "",
    accountNumber: "",
    taxNumber: "",
    taxEnabled: false,
    taxRate: 15,
    crNumber: "",
    logoUrl: "",
    faviconUrl: "",
    siteClosed: false,
    notificationLeadDays: 30,
  };
}

export default function AdminSettingsPage() {
  const settings = useAppSettings();
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // The doc loads asynchronously (undefined while pending, null if it never
  // existed) — sync the form once real data arrives instead of on every
  // render, so the admin's in-progress edits aren't clobbered by re-syncs.
  useEffect(() => {
    if (settings) setForm({ ...emptyForm(), ...settings });
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updateAppSettings(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <DashboardShell allow={["admin"]} title="إعدادات النظام">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>بيانات الشركة</CardTitle>
              <CardSubtitle>تظهر على السندات والفواتير المطبوعة</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="snameAr">اسم الشركة (عربي)</Label>
                <Input id="snameAr" value={form.companyNameAr} onChange={(e) => set("companyNameAr", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="snameEn">اسم الشركة (إنجليزي)</Label>
                <Input id="snameEn" dir="ltr" value={form.companyNameEn} onChange={(e) => set("companyNameEn", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="semail">البريد الإلكتروني</Label>
                <Input id="semail" type="email" dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sphone">الجوال</Label>
                <Input id="sphone" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="swhatsapp">رقم الواتساب</Label>
                <Input id="swhatsapp" dir="ltr" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="scity">المدينة</Label>
                <Input id="scity" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label htmlFor="saddress">العنوان</Label>
                <Input id="saddress" value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="slogo">رابط شعار الشركة (اختياري)</Label>
                <Input id="slogo" type="url" dir="ltr" placeholder="https://" value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sfavicon">رابط أيقونة المتصفح (اختياري)</Label>
                <Input id="sfavicon" type="url" dir="ltr" placeholder="https://" value={form.faviconUrl} onChange={(e) => set("faviconUrl", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>البيانات المالية والضريبية</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sbank">اسم البنك</Label>
                <Input id="sbank" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="saccount">رقم الحساب / الآيبان</Label>
                <Input id="saccount" dir="ltr" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="scr">رقم السجل التجاري</Label>
                <Input id="scr" dir="ltr" value={form.crNumber} onChange={(e) => set("crNumber", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="staxnum">الرقم الضريبي</Label>
                <Input id="staxnum" dir="ltr" value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="staxrate">نسبة الضريبة (%)</Label>
                <Input id="staxrate" type="number" min={0} max={100} value={form.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={form.taxEnabled}
                    onChange={(e) => set("taxEnabled", e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-brand-600"
                  />
                  تفعيل الضريبة
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>الإشعارات والصيانة</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slead">موعد التنبيه (عدد الأيام قبل الاستحقاق)</Label>
                <Input
                  id="slead"
                  type="number"
                  min={1}
                  value={form.notificationLeadDays}
                  onChange={(e) => set("notificationLeadDays", Number(e.target.value) || 30)}
                />
                <p className="text-xs text-muted mt-1">
                  مثال: 5 أيام تعني التنبيه بعقد ينتهي في 2026-08-30 اعتبارًا من 2026-08-25.
                </p>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-danger-600">
                  <input
                    type="checkbox"
                    checked={form.siteClosed}
                    onChange={(e) => set("siteClosed", e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-danger-500"
                  />
                  إغلاق النظام مؤقتًا (وضع الصيانة — يمنع الوصول عن كل الأدوار عدا مدير النظام)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="self-start">
          <Save size={15} /> {saving ? "جارِ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
        </Button>
      </form>
    </DashboardShell>
  );
}
