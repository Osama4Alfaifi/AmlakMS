"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { buildPortfolio } from "@/components/owner/PortfolioSection";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { currency } from "@/lib/mock-data";
import {
  useOwnerContracts,
  useOwnerDocumentLinks,
  useOwnerProperties,
  useOwnerUnits,
  useTenants,
} from "@/lib/firestore/hooks";

export default function OwnerPropertiesPage() {
  const { user } = useAuth();
  const t = useT();
  const ownerId = user?.linkedId ?? undefined;
  const { data: properties } = useOwnerProperties(ownerId);
  const { data: units } = useOwnerUnits(ownerId);
  const { data: contracts } = useOwnerContracts(ownerId);
  const { data: tenants } = useTenants();
  const { data: documents } = useOwnerDocumentLinks(ownerId);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => buildPortfolio(properties, units, contracts, tenants), [properties, units, contracts, tenants]);
  const filtered = rows.filter(
    (r) => !query || [r.property.title, r.property.city, r.property.district].some((v) => v?.includes(query))
  );

  // Documents tied to the property itself, its units, or any of its contracts.
  function docCount(propertyId: string) {
    const unitIds = new Set(units.filter((u) => u.propertyId === propertyId).map((u) => u.id));
    const contractIds = new Set(contracts.filter((c) => c.propertyId === propertyId).map((c) => c.id));
    return documents.filter(
      (d) =>
        (d.entityType === "عقار" && d.entityId === propertyId) ||
        (d.entityType === "وحدة" && unitIds.has(d.entityId)) ||
        (d.entityType === "عقد" && contractIds.has(d.entityId))
    ).length;
  }

  return (
    <DashboardShell allow={["owner"]} title={t("عقاراتي")}>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>عقاراتي</CardTitle>
            <CardSubtitle>اختر عقارًا لعرض تفاصيله ووحداته ومستنداته.</CardSubtitle>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder={t("بحث...")} value={query} onChange={(e) => setQuery(e.target.value)} className="pe-9" />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2.5">
            {filtered.map((r) => {
              const single = r.units.length === 1 && r.units[0].whole;
              const docs = docCount(r.property.id);
              return (
                <li key={r.property.id}>
                  <Link
                    href={`/owner/properties/${r.property.id}`}
                    className="pressable group flex items-center gap-3 rounded-2xl bg-surface-sunken/60 p-4 hover:bg-surface-sunken"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold leading-snug">{r.property.title}</span>
                      <span className="block text-xs text-muted mt-0.5">
                        {r.property.city} · {r.property.district} · {r.property.type}
                      </span>
                      <span className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                        <span>
                          {single ? t("وحدة واحدة") : `${r.units.length} ${t("وحدات")}`} ·{" "}
                          <span className="num font-semibold">
                            {r.rented}/{r.units.length}
                          </span>{" "}
                          {t("مؤجرة")}
                        </span>
                        <span className="num font-semibold">{currency(r.income)}</span>
                        <span className="inline-flex items-center gap-1 text-muted">
                          <FileText size={14} /> <span className="num">{docs}</span> {t("مستند")}
                        </span>
                        {r.overdue > 0 && <Badge tone="danger">{`${r.overdue} ${t("متأخرة")}`}</Badge>}
                      </span>
                    </span>
                    <ChevronDown
                      size={20}
                      className="shrink-0 text-muted rotate-90 ltr:-rotate-90 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] group-hover:-translate-x-1 ltr:group-hover:translate-x-1"
                    />
                  </Link>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="py-8 text-center text-sm text-muted">{t("لا توجد عقارات بعد")}</li>}
          </ul>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
