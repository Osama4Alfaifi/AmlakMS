"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import {
  useContracts,
  useDocumentLinks,
  useOwners,
  useProperties,
  useTenants,
} from "@/lib/firestore/hooks";
import { contractDisplayNumber } from "@/lib/contracts/display";
import { createDocumentLink } from "@/lib/firestore/mutations";
import type { DocumentCategory, DocumentEntityType } from "@/lib/types";
import { ExternalLink, Plus, Search } from "lucide-react";

const CATEGORIES: DocumentCategory[] = ["عقد", "فاتورة", "هوية", "صك ملكية", "تأمين", "أخرى"];
const ENTITY_TYPES: DocumentEntityType[] = ["عقار", "عقد", "مالك", "مستأجر"];

export default function AdminDocumentsPage() {
  const { data: documents } = useDocumentLinks();
  const { data: properties } = useProperties();
  const { data: contracts } = useContracts();
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [docCategory, setDocCategory] = useState<DocumentCategory>("عقد");
  const [entityType, setEntityType] = useState<DocumentEntityType>("عقار");
  const [entityId, setEntityId] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const entityOptions = useMemo(() => {
    switch (entityType) {
      case "عقار":
        return properties.map((p) => ({ id: p.id, label: p.title }));
      case "عقد":
        return contracts.map((c) => ({ id: c.id, label: contractDisplayNumber(c) }));
      case "مالك":
        return owners.map((o) => ({ id: o.id, label: o.name }));
      case "مستأجر":
        return tenants.map((t) => ({ id: t.id, label: t.name }));
    }
  }, [entityType, properties, contracts, owners, tenants]);

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) => (category === "الكل" || d.category === category) && (d.title.includes(query) || d.entityLabel.includes(query))
      ),
    [documents, category, query]
  );

  function resolveOwnerId(): string | undefined {
    switch (entityType) {
      case "عقار":
        return properties.find((p) => p.id === entityId)?.ownerId;
      case "عقد":
        return contracts.find((c) => c.id === entityId)?.ownerId;
      case "مالك":
        return entityId;
      case "مستأجر": {
        const tenant = tenants.find((t) => t.id === entityId);
        return properties.find((p) => p.id === tenant?.propertyId)?.ownerId;
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entity = entityOptions?.find((o) => o.id === entityId);
    if (!title.trim() || !entity || !url.trim()) return;
    setSubmitting(true);
    await createDocumentLink({
      title,
      category: docCategory,
      entityType,
      entityId: entity.id,
      entityLabel: entity.label,
      ownerId: resolveOwnerId(),
      url,
      notes: notes || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setShowForm(false);
    setTitle("");
    setEntityId("");
    setUrl("");
    setNotes("");
  }

  return (
    <DashboardShell allow={["admin"]} title="المستندات">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>كتالوج روابط المستندات</CardTitle>
              <CardSubtitle>
                {documents.length} مستند — روابط لملفات مستضافة خارجيًا (Google Drive، بريد إلكتروني، إلخ)؛
                الرفع المباشر داخل التطبيق يتطلب ترقية خطة Firebase لاحقًا
              </CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-36">
                {["الكل", ...CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <div className="relative w-52">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
              </div>
              <Button size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus size={15} /> مستند جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العنوان</Th>
                  <Th>الفئة</Th>
                  <Th>مرتبط بـ</Th>
                  <Th>الرابط</Th>
                  <Th>التاريخ</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-muted py-6">لا توجد مستندات مطابقة</Td>
                  </Tr>
                )}
                {filtered.map((d) => (
                  <Tr key={d.id}>
                    <Td className="font-semibold">{d.title}</Td>
                    <Td><Badge>{d.category}</Badge></Td>
                    <Td className="text-muted">{d.entityType} · {d.entityLabel}</Td>
                    <Td>
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                        <ExternalLink size={14} /> فتح الرابط
                      </a>
                    </Td>
                    <Td className="text-muted">{d.createdAt}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>مستند جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dtitle">العنوان</Label>
                  <Input id="dtitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="dcategory">الفئة</Label>
                  <Select id="dcategory" value={docCategory} onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dentityType">نوع الكيان المرتبط</Label>
                  <Select id="dentityType" value={entityType} onChange={(e) => { setEntityType(e.target.value as DocumentEntityType); setEntityId(""); }}>
                    {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dentity">الكيان</Label>
                  <Select id="dentity" value={entityId} onChange={(e) => setEntityId(e.target.value)} required>
                    <option value="" disabled>اختر...</option>
                    {entityOptions?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="durl">الرابط</Label>
                  <Input id="durl" type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} required dir="ltr" />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="dnotes">ملاحظات</Label>
                  <Input id="dnotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button type="submit" disabled={submitting} className="sm:col-span-3 self-start">
                  {submitting ? "جارِ الحفظ..." : "حفظ المستند"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
