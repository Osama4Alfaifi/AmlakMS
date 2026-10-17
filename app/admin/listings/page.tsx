"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { useOwnerProperties, useOwnerUnits } from "@/lib/firestore/hooks";
import { updateProperty, updateUnit } from "@/lib/firestore/mutations";
import { Search } from "lucide-react";

const LISTING_TABS = ["الكل", "عروض إيجار", "عروض بيع", "عروض استثمار"] as const;
type ListingTab = (typeof LISTING_TABS)[number];
const LISTING_TYPES = ["إيجار", "بيع", "استثمار"] as const;
type ListingType = (typeof LISTING_TYPES)[number];

const TAB_TO_TYPE: Partial<Record<ListingTab, ListingType>> = {
  "عروض إيجار": "إيجار",
  "عروض بيع": "بيع",
  "عروض استثمار": "استثمار",
};

// A "listing" is whatever's actually being priced: a unit if the property
// has any, otherwise the property itself (a standalone listing with no
// sub-units) — see Unit/Property in lib/types.ts. Pricing lives entirely
// here now (app/admin/listings), not on the properties/units intake forms —
// see app/admin/properties and app/admin/properties/new.
interface ListingRow {
  kind: "property" | "unit";
  id: string;
  propertyTitle: string;
  unitLabel: string;
  type: string;
  listingType: ListingType;
  price: number;
}

export default function ListingsPage() {
  const scope = useAccountantOwnerScope();
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: units } = useOwnerUnits(scope.queryOwnerId);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ListingTab>("الكل");

  const unitsByProperty = useMemo(() => {
    const map = new Map<string, typeof units>();
    units.forEach((u) => map.set(u.propertyId, [...(map.get(u.propertyId) ?? []), u]));
    return map;
  }, [units]);

  const rows: ListingRow[] = useMemo(() => {
    const list: ListingRow[] = [];
    properties.forEach((p) => {
      const propertyUnits = unitsByProperty.get(p.id) ?? [];
      if (propertyUnits.length === 0) {
        list.push({ kind: "property", id: p.id, propertyTitle: p.title, unitLabel: "—", type: p.type, listingType: p.listingType, price: p.price });
      } else {
        propertyUnits.forEach((u) => {
          list.push({ kind: "unit", id: u.id, propertyTitle: p.title, unitLabel: u.unitNumber, type: u.type, listingType: u.listingType, price: u.price });
        });
      }
    });
    return list;
  }, [properties, unitsByProperty]);

  const tabType = TAB_TO_TYPE[tab];
  const filtered = rows.filter(
    (r) => (!tabType || r.listingType === tabType) && (r.propertyTitle.includes(query) || r.unitLabel.includes(query))
  );

  const countByTab = useMemo(() => {
    const counts: Record<ListingTab, number> = { "الكل": rows.length, "عروض إيجار": 0, "عروض بيع": 0, "عروض استثمار": 0 };
    rows.forEach((r) => {
      if (r.listingType === "إيجار") counts["عروض إيجار"]++;
      else if (r.listingType === "بيع") counts["عروض بيع"]++;
      else counts["عروض استثمار"]++;
    });
    return counts;
  }, [rows]);

  async function handlePriceChange(row: ListingRow, price: number) {
    if (row.kind === "property") await updateProperty(row.id, { price });
    else await updateUnit(row.id, { price });
  }

  async function handleListingTypeChange(row: ListingRow, listingType: ListingType) {
    if (row.kind === "property") await updateProperty(row.id, { listingType });
    else await updateUnit(row.id, { listingType });
  }

  return (
    <DashboardShell allow={["admin", "leasingAgent"]} title="العروض">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>العروض</CardTitle>
            <CardSubtitle>{filtered.length} من {rows.length} — حدد نوع العرض والسعر لكل وحدة أو عقار مستقل</CardSubtitle>
          </div>
          <div className="relative w-64">
            <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input placeholder="بحث عن عقار أو وحدة..." value={query} onChange={(e) => setQuery(e.target.value)} className="pe-9" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-1 self-start">
            {LISTING_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t ? "bg-primary text-on-primary" : "text-muted hover:bg-background"
                }`}
              >
                {t} <span className="opacity-70">({countByTab[t]})</span>
              </button>
            ))}
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>العقار</Th>
                <Th>الوحدة</Th>
                <Th>النوع</Th>
                <Th>نوع العرض</Th>
                <Th>السعر</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((r) => (
                <Tr key={`${r.kind}-${r.id}`}>
                  <Td className="font-semibold">{r.propertyTitle}</Td>
                  <Td className="text-muted">{r.unitLabel}</Td>
                  <Td className="text-muted">{r.type}</Td>
                  <Td>
                    <div className="flex rounded-lg border border-border overflow-hidden text-xs w-fit">
                      {LISTING_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleListingTypeChange(r, t)}
                          className={`px-2.5 py-1.5 font-semibold ${r.listingType === t ? "bg-primary text-on-primary" : "text-muted hover:bg-background"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Input
                        key={`price-${r.id}-${r.price}`}
                        type="number"
                        min={0}
                        defaultValue={r.price}
                        onBlur={(e) => {
                          const next = Number(e.target.value) || 0;
                          if (next !== r.price) handlePriceChange(r, next);
                        }}
                        className="w-28 py-1.5 text-xs"
                      />
                      {r.listingType === "إيجار" && <span className="text-muted text-xs whitespace-nowrap">/سنويًا</span>}
                    </div>
                  </Td>
                </Tr>
              ))}
              {filtered.length === 0 && (
                <Tr>
                  <Td colSpan={5} className="text-center text-muted py-6">لا توجد عروض في هذا التصنيف</Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
