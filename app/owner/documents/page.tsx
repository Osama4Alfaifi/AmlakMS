"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth-context";
import { useOwnerDocumentLinks } from "@/lib/firestore/hooks";
import type { DocumentCategory } from "@/lib/types";
import { ExternalLink, Search } from "lucide-react";

const CATEGORIES: DocumentCategory[] = ["عقد", "فاتورة", "هوية", "صك ملكية", "تأمين", "أخرى"];

export default function OwnerDocumentsPage() {
  const { user } = useAuth();
  const { data: documents } = useOwnerDocumentLinks(user?.linkedId ?? undefined);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) => (category === "الكل" || d.category === category) && (d.title.includes(query) || d.entityLabel.includes(query))
      ),
    [documents, category, query]
  );

  return (
    <DashboardShell allow={["owner"]} title="المستندات">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>مستنداتي</CardTitle>
              <CardSubtitle>{documents.length} مستند مرتبط بعقاراتك وعقودك</CardSubtitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-36">
                {["الكل", ...CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <div className="relative w-52">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder="بحث..." value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
              </div>
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
                    <Td colSpan={5} className="text-center text-muted py-6">لا توجد مستندات حاليًا</Td>
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
      </div>
    </DashboardShell>
  );
}
