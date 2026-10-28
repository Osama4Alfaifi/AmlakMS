"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DocLink } from "@/components/ui/DocLink";
import { Input, Select } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { contractDisplayNumber } from "@/lib/contracts/display";
import { useOwnerContracts, useOwnerDocumentLinks, useOwnerProperties } from "@/lib/firestore/hooks";
import { useT } from "@/lib/i18n";
import type { DocumentCategory, DocumentLink } from "@/lib/types";

// "contracts": lease documents (contract copies and anything linked to a
// contract). "other": every remaining document (deeds, insurance, invoices...).
export type DocumentsKind = "contracts" | "other";

const OTHER_CATEGORIES: DocumentCategory[] = ["فاتورة", "هوية", "صك ملكية", "تأمين", "أخرى"];

const TABS: { kind: DocumentsKind; href: string; label: string }[] = [
  { kind: "contracts", href: "/owner/documents/contracts", label: "العقود" },
  { kind: "other", href: "/owner/documents", label: "وثائق أخرى" },
];

export function OwnerDocumentsView({ kind }: { kind: DocumentsKind }) {
  const { user } = useAuth();
  const t = useT();
  const ownerId = user?.linkedId ?? undefined;
  const { data: links } = useOwnerDocumentLinks(ownerId);
  const { data: contracts } = useOwnerContracts(ownerId);
  const { data: properties } = useOwnerProperties(ownerId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");

  const documents = useMemo<DocumentLink[]>(() => {
    const isContractDoc = (d: DocumentLink) => d.category === "عقد" || d.entityType === "عقد";
    if (kind === "other") return links.filter((d) => !isContractDoc(d));
    const fromLinks = links.filter(isContractDoc);
    // The copy of each lease saved on the contract itself counts as a contract
    // document too, unless a document link already points to the same file.
    const known = new Set(fromLinks.map((d) => d.url));
    const fromContracts: DocumentLink[] = contracts
      .filter((c) => c.documentUrl && !known.has(c.documentUrl))
      .map((c) => ({
        id: `contract-${c.id}`,
        title: `${t("نسخة العقد")} ${contractDisplayNumber(c)}`,
        category: "عقد",
        entityType: "عقد",
        entityId: c.id,
        entityLabel: `${contractDisplayNumber(c)} — ${properties.find((p) => p.id === c.propertyId)?.title ?? ""}`,
        ownerId: c.ownerId,
        url: c.documentUrl as string,
        createdAt: c.signedAt ?? c.startDate,
      }));
    return [...fromLinks, ...fromContracts];
  }, [kind, links, contracts, properties, t]);

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          (kind === "contracts" || category === "الكل" || d.category === category) &&
          (d.title.includes(query) || d.entityLabel.includes(query))
      ),
    [documents, kind, category, query]
  );

  return (
    <DashboardShell allow={["owner"]} title={t(kind === "contracts" ? "العقود" : "وثائق أخرى")}>
      <div className="flex flex-col gap-4">
        <nav aria-label={t("المستندات")} className="inline-flex w-fit rounded-xl bg-surface-sunken p-1 text-sm font-semibold">
          {TABS.map((tab) => (
            <Link
              key={tab.kind}
              href={tab.href}
              aria-current={tab.kind === kind ? "page" : undefined}
              className={cn(
                "pressable px-5 min-h-10 inline-flex items-center rounded-lg",
                tab.kind === kind ? "bg-surface shadow-control" : "text-muted hover:text-foreground"
              )}
            >
              {t(tab.label)}
            </Link>
          ))}
        </nav>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{kind === "contracts" ? "عقودي" : "وثائقي"}</CardTitle>
              <CardSubtitle>
                {`${documents.length} ${t(kind === "contracts" ? "مستند مرتبط بعقودك" : "وثيقة مرتبطة بعقاراتك ووحداتك")}`}
              </CardSubtitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {kind === "other" && (
                <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-36">
                  {["الكل", ...OTHER_CATEGORIES].map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </Select>
              )}
              <div className="relative w-52">
                <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input placeholder={t("بحث...")} value={query} onChange={(e) => setQuery(e.target.value)} className="pe-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العنوان</Th>
                  {kind === "other" && <Th>الفئة</Th>}
                  <Th>مرتبط بـ</Th>
                  <Th>الرابط</Th>
                  <Th>التاريخ</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.length === 0 && (
                  <Tr>
                    <Td colSpan={kind === "other" ? 5 : 4} className="text-center text-muted py-6">
                      {t("لا توجد مستندات حاليًا")}
                    </Td>
                  </Tr>
                )}
                {filtered.map((d) => (
                  <Tr key={d.id}>
                    <Td className="font-semibold">{d.title}</Td>
                    {kind === "other" && (
                      <Td>
                        <Badge>{d.category}</Badge>
                      </Td>
                    )}
                    <Td className="text-muted">
                      {t(d.entityType)} · {d.entityLabel}
                    </Td>
                    <Td>
                      <DocLink url={d.url} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                        <ExternalLink size={14} /> {t("فتح الرابط")}
                      </DocLink>
                    </Td>
                    <Td className="text-muted num">{d.createdAt}</Td>
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
