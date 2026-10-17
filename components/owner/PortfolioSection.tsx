"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { currency } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import type { Contract, Property, Tenant, Unit } from "@/lib/types";

interface UnitRow {
  key: string;
  label: string;
  detail: string;
  // The property itself acting as its only unit (it has no Unit records).
  whole: boolean;
  status: "مؤجرة" | "شاغرة" | "تحت الصيانة";
  tenantName?: string;
  rent: number;
  // Leased through one contract that covers the whole property: no rent of
  // its own on this unit, so it is shown once on the property instead.
  viaProperty?: boolean;
  endDate?: string;
  overdue: number;
}

interface PropertyRow {
  property: Property;
  units: UnitRow[];
  rented: number;
  income: number;
  overdue: number;
}

const today = () => new Date().toISOString().slice(0, 10);

function overdueCount(contract: Contract | undefined) {
  if (!contract) return 0;
  const now = today();
  return (contract.payments ?? []).filter((p) => p.status !== "مسددة" && p.dueDate < now).length;
}

// A property is a building or plot; the things that get leased are its units.
// A property without Unit records is treated as a single unit that is the
// property itself, so every property always has at least one row to rent out.
export function buildPortfolio(properties: Property[], units: Unit[], contracts: Contract[], tenants: Tenant[]): PropertyRow[] {
  const active = contracts.filter((c) => c.status === "نشط");
  const tenantName = (c?: Contract) => (c ? tenants.find((t) => t.id === c.tenantId)?.name : undefined);

  return properties.map((property) => {
    const own = units.filter((u) => u.propertyId === property.id);
    const wholeContract = own.length ? active.find((x) => x.propertyId === property.id && !x.unitId) : undefined;
    const rows: UnitRow[] = own.length
      ? own
          .slice()
          .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }))
          .map((u) => {
            const own_c = active.find((x) => x.unitId === u.id);
            const c = own_c ?? wholeContract;
            return {
              key: u.id,
              label: u.unitNumber,
              detail: [u.type, u.area ? `${u.area} م²` : null].filter(Boolean).join(" · "),
              whole: false,
              status: c ? "مؤجرة" : u.status === "تحت الصيانة" ? "تحت الصيانة" : "شاغرة",
              tenantName: tenantName(c),
              rent: own_c?.value ?? 0,
              viaProperty: !own_c && !!wholeContract,
              endDate: c?.endDate,
              overdue: own_c ? overdueCount(own_c) : 0,
            };
          })
      : (() => {
          const c = active.find((x) => x.propertyId === property.id && !x.unitId) ?? active.find((x) => x.propertyId === property.id);
          return [
            {
              key: property.id,
              label: "",
              detail: [property.type, property.area ? `${property.area} م²` : null].filter(Boolean).join(" · "),
              whole: true,
              status: c ? "مؤجرة" : property.status === "تحت الصيانة" ? "تحت الصيانة" : "شاغرة",
              tenantName: tenantName(c),
              rent: c?.value ?? 0,
              endDate: c?.endDate,
              overdue: overdueCount(c),
            } satisfies UnitRow,
          ];
        })();

    return {
      property,
      units: rows,
      rented: rows.filter((r) => r.status === "مؤجرة").length,
      income: rows.reduce((s, r) => s + r.rent, 0) + (wholeContract?.value ?? 0),
      overdue: rows.reduce((s, r) => s + r.overdue, 0) + overdueCount(wholeContract),
    };
  });
}

export function PortfolioSection({
  rows,
  paidInstallments,
  amountToVerify,
}: {
  rows: PropertyRow[];
  paidInstallments: number;
  amountToVerify: number;
}) {
  const t = useT();
  const totalUnits = rows.reduce((s, r) => s + r.units.length, 0);
  const rented = rows.reduce((s, r) => s + r.rented, 0);
  const overdue = rows.reduce((s, r) => s + r.overdue, 0);

  return (
    <Card id="properties" className="scroll-mt-20">
      <CardHeader>
        <div>
          <CardTitle>عقاراتي ووحداتها</CardTitle>
          <CardSubtitle>العقار قد يضم عدة وحدات. العقار الذي لا وحدات له يُحتسب وحدة واحدة.</CardSubtitle>
        </div>
        <Badge tone={overdue ? "danger" : "success"}>
          {overdue ? `${overdue} ${t("دفعة متأخرة")}` : t("لا توجد دفعات متأخرة")}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-5 sm:gap-x-0 sm:divide-x sm:divide-border">
          <Fact label={t("العقارات")} value={String(rows.length)} className="sm:pe-5" />
          <Fact label={t("الوحدات")} value={String(totalUnits)} className="sm:px-5" />
          <Fact label={t("مؤجرة")} value={String(rented)} tone="text-success-700" className="sm:px-5" />
          <Fact label={t("شاغرة")} value={String(totalUnits - rented)} tone="text-warning-700" className="sm:px-5" />
          <Fact label={t("مبالغ تحتاج تحقق")} value={currency(amountToVerify)} tone="text-danger-700" className="col-span-2 sm:col-span-1 sm:ps-5" />
        </dl>
        <p className="mt-3 text-xs text-muted">
          {t("دفعات مسددة")}: <span className="num font-semibold text-foreground">{paidInstallments}</span>
        </p>

        <ul className="mt-4 -mx-1 flex flex-col gap-2">
          {rows.map((row, i) => (
            <PropertyItem key={row.property.id} row={row} defaultOpen={i === 0} />
          ))}
          {rows.length === 0 && <li className="px-1 py-6 text-center text-sm text-muted">{t("لا توجد عقارات بعد")}</li>}
        </ul>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value, tone, className }: { label: string; value: string; tone?: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={cn("num mt-1 text-xl font-extrabold", tone)}>{value}</dd>
    </div>
  );
}

function PropertyItem({ row, defaultOpen }: { row: PropertyRow; defaultOpen: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);
  const { property, units } = row;
  const single = units.length === 1 && units[0].whole;
  const panelId = `prop-${property.id}`;

  return (
    <li className="rounded-2xl bg-surface-sunken/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="pressable w-full flex items-center gap-3 rounded-2xl p-3.5 text-start hover:bg-surface-sunken"
      >
        <ChevronDown
          size={18}
          className={cn("shrink-0 text-muted transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]", open && "rotate-180")}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug">{property.title}</span>
          <span className="block text-xs text-muted mt-0.5">
            {property.city} · {property.district} · {property.type}
          </span>
        </span>
        <span className="hidden sm:flex flex-col items-end text-xs text-muted shrink-0">
          <span>
            {single ? t("وحدة واحدة") : `${units.length} ${t("وحدات")}`} ·{" "}
            <span className="num font-semibold text-foreground">
              {row.rented}/{units.length}
            </span>{" "}
            {t("مؤجرة")}
          </span>
          <span className="num font-semibold text-foreground mt-0.5">{currency(row.income)}</span>
        </span>
        {row.overdue > 0 && <Badge tone="danger">{`${row.overdue} ${t("متأخرة")}`}</Badge>}
      </button>

      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="sm:hidden px-4 pb-1 text-xs text-muted">
            {single ? t("وحدة واحدة") : `${units.length} ${t("وحدات")}`} · {row.rented}/{units.length} {t("مؤجرة")} · {currency(row.income)}
          </p>
          <ul className="px-2 pb-2">
            {units.map((u) => (
              <li key={u.key} className="rounded-xl bg-surface px-3.5 py-3 mt-2 shadow-control">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">
                      {u.whole ? t("العقار كاملًا (وحدة واحدة)") : `${t("وحدة")} ${u.label}`}
                    </p>
                    {u.detail && <p className="text-xs text-muted mt-0.5">{u.detail}</p>}
                  </div>
                  <Badge tone={u.status === "شاغرة" ? "warning" : undefined}>{u.status}</Badge>
                </div>
                <dl className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <dt className="text-xs text-muted">{t("المستأجر")}</dt>
                    <dd className="font-medium truncate">{u.tenantName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t("الإيجار السنوي")}</dt>
                    <dd className="num font-medium">{u.viaProperty ? t("ضمن عقد العقار") : u.rent ? currency(u.rent) : "—"}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-xs text-muted">{t("ينتهي العقد")}</dt>
                    <dd className="num font-medium">
                      {u.endDate ?? "—"}
                      {u.overdue > 0 && <span className="ms-2 text-danger-700 text-xs font-semibold">{`${u.overdue} ${t("متأخرة")}`}</span>}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
