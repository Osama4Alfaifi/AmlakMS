"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CameraIcon } from "@/components/ui/icons";
import { PhotoStrip } from "@/components/ui/PhotoStrip";
import { contractDisplayNumber } from "@/lib/contracts/display";
import { MAX_PHOTOS, readPhoto } from "@/lib/files";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth-context";
import { useFirestoreDoc, useMyMaintenanceRequests } from "@/lib/firestore/hooks";
import { createMaintenanceRequest } from "@/lib/firestore/mutations";
import type { Contract, Priority, Property, Tenant, Unit } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

export default function TenantMaintenancePage() {
  const { user } = useAuth();
  const currentTenant = useFirestoreDoc<Tenant>("tenants", user?.linkedId ?? undefined);
  const { data: requests } = useMyMaintenanceRequests(user?.uid);
  // Single get-by-id — matches firestore.rules' myTenantPropertyId() scoping.
  const myProperty = useFirestoreDoc<Property>("properties", currentTenant?.propertyId);
  // The tenant's own lease and unit (single get-by-id, like the dashboard does).
  const myContract = useFirestoreDoc<Contract>("contracts", currentTenant?.contractId || undefined);
  const myUnit = useFirestoreDoc<Unit>("units", currentTenant?.unitId || undefined);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("متوسط");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!currentTenant || !user) return null;

  async function addPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setPhotoError(null);
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setPhotoError(`الحد الأقصى ${MAX_PHOTOS} صور لكل طلب.`);
    const added: string[] = [];
    for (const f of files.slice(0, Math.max(0, room))) {
      try {
        added.push(await readPhoto(f));
      } catch {
        setPhotoError("تعذّر إضافة إحدى الصور. استخدم صورة بصيغة JPG أو PNG.");
      }
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !currentTenant || !user) return;
    setSubmitting(true);
    await createMaintenanceRequest({
      propertyId: currentTenant.propertyId,
      unitId: currentTenant.unitId || undefined,
      contractId: currentTenant.contractId || undefined,
      photos: photos.length ? photos : undefined,
      ownerId: myProperty?.ownerId ?? null,
      tenantName: currentTenant.name,
      createdByUid: user.uid,
      technicianId: null,
      title,
      description,
      priority,
      status: "جديد",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setTitle("");
    setDescription("");
    setPriority("متوسط");
    setPhotos([]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <DashboardShell allow={["tenant"]} title="طلبات الصيانة">
      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>تقديم طلب صيانة جديد</CardTitle>
              <CardSubtitle>سيتم تعيين فني صيانة مناسب لطلبك</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contractNo">رقم العقد</Label>
                  <Input id="contractNo" value={myContract ? contractDisplayNumber(myContract) : "—"} readOnly dir="ltr" className="bg-surface-sunken" />
                </div>
                <div>
                  <Label htmlFor="unitNo">رقم الوحدة</Label>
                  <Input id="unitNo" value={myUnit ? myUnit.unitNumber : "العقار كاملًا"} readOnly className="bg-surface-sunken" />
                </div>
              </div>
              <div>
                <Label htmlFor="title">عنوان المشكلة</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: عطل في التكييف" required />
              </div>
              <div>
                <Label htmlFor="priority">الأولوية</Label>
                <Select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                  <option value="منخفض">منخفض</option>
                  <option value="متوسط">متوسط</option>
                  <option value="عاجل">عاجل</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">تفاصيل إضافية</Label>
                <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." />
              </div>
              <div>
                <Label htmlFor="photos">صور المشكلة</Label>
                <label className="pressable cursor-pointer flex items-center gap-3 rounded-xl border-2 border-dashed border-border-strong p-3 hover:bg-surface-sunken/60">
                  <CameraIcon className="text-brand-700 shrink-0" />
                  <span className="text-sm font-semibold">{photos.length >= MAX_PHOTOS ? "اكتمل عدد الصور" : "إضافة صور"}</span>
                  <span className="text-xs text-muted ms-auto num">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                  <input id="photos" type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} disabled={photos.length >= MAX_PHOTOS} />
                </label>
                {photos.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {photos.map((p, i) => (
                      <li key={i} className="relative h-16 w-16">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt="" className="h-full w-full rounded-lg object-cover shadow-control" />
                        <button
                          type="button"
                          aria-label="حذف الصورة"
                          onClick={() => setPhotos((arr) => arr.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -end-1.5 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                        >
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {photoError && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-danger-700">
                    {photoError}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={submitting}>{submitting ? "جارِ الإرسال..." : "إرسال الطلب"}</Button>
              {submitted && (
                <p className="flex items-center gap-1.5 text-success-700 text-xs font-semibold">
                  <CheckCircle2 size={15} /> تم إرسال طلبك بنجاح، وسيظهر فورًا لدى فريق الصيانة
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>طلباتي السابقة</CardTitle>
              <CardSubtitle>{requests.length} طلب</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الطلب</Th>
                  <Th>العقد / الوحدة</Th>
                  <Th>الأولوية</Th>
                  <Th>تاريخ الإنشاء</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {requests.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-muted py-6">لا توجد طلبات صيانة بعد</Td>
                  </Tr>
                )}
                {requests.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold max-w-[220px]">
                      <span className="block truncate">{r.title}</span>
                      {r.description && <span className="block text-xs text-muted truncate">{r.description}</span>}
                      <PhotoStrip photos={r.photos} />
                    </Td>
                    <Td className="text-muted num">
                      {myContract && r.contractId === myContract.id ? contractDisplayNumber(myContract) : "—"}
                      {r.unitId && myUnit && r.unitId === myUnit.id ? ` / ${myUnit.unitNumber}` : ""}
                    </Td>
                    <Td><Badge>{r.priority}</Badge></Td>
                    <Td className="text-muted">{r.createdAt}</Td>
                    <Td><Badge>{r.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
