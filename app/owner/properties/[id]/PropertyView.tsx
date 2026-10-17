"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DocumentList } from "@/components/owner/DocumentList";
import { buildPortfolio, type UnitRow } from "@/components/owner/PortfolioSection";
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
import type { DocumentLink, MeterBilledTo } from "@/lib/types";

interface FactItem {
  label: string;
  value: React.ReactNode;
}

function Facts({ items }: { items: (FactItem | null | false | undefined)[] }) {
  const shown = items.filter(Boolean) as FactItem[];
  if (!shown.length) return null;
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 text-sm">
      {shown.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="text-xs text-muted">{f.label}</dt>
          <dd className="font-medium break-words">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const meter = (number?: string, billedTo?: MeterBilledTo) =>
  number ? (
    <span>
      <span className="num">{number}</span>
      {billedTo && <span className="text-xs text-muted"> · {billedTo}</span>}
    </span>
  ) : null;

export default function PropertyView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const t = useT();
  const ownerId = user?.linkedId ?? undefined;
  const { data: properties } = useOwnerProperties(ownerId);
  const { data: units } = useOwnerUnits(ownerId);
  const { data: contracts } = useOwnerContracts(ownerId);
  const { data: tenants } = useTenants();
  const { data: documents } = useOwnerDocumentLinks(ownerId);

  const property = properties.find((p) => p.id === id);
  const row = property ? buildPortfolio([property], units, contracts, tenants)[0] : undefined;

  const docsFor = (type: DocumentLink["entityType"], ids: string[]) =>
    documents.filter((d) => d.entityType === type && ids.includes(d.entityId));

  const backLink = (
    <Link
      href="/owner/properties"
      className="inline-flex items-center gap-1.5 min-h-10 text-sm font-semibold text-brand-700 hover:underline w-fit"
    >
      <ChevronDown size={16} className="-rotate-90 ltr:rotate-90" />
      {t("عقاراتي")}
    </Link>
  );

  if (!property || !row) {
    return (
      <DashboardShell allow={["owner"]} title={t("عقاراتي")}>
        {backLink}
        <p className="py-10 text-center text-sm text-muted">{properties.length ? t("لم يتم العثور على هذا العقار") : t("جارِ التحميل...")}</p>
      </DashboardShell>
    );
  }

  const single = row.units.length === 1 && row.units[0].whole;
  // Documents on the property itself plus any lease that covers all of it.
  const propertyDocs = [
    ...docsFor("عقار", [property.id]),
    ...(row.wholeContract ? docsFor("عقد", [row.wholeContract.id]) : []),
    ...(single && row.units[0].contract ? docsFor("عقد", [row.units[0].contract.id]) : []),
  ].filter((d, i, a) => a.findIndex((x) => x.id === d.id) === i);

  return (
    <DashboardShell allow={["owner"]} title={property.title}>
      {backLink}

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg">{property.title}</CardTitle>
            <CardSubtitle>
              {[property.region, property.city, property.district].filter(Boolean).join(" · ")}
              {property.address ? ` — ${property.address}` : ""}
            </CardSubtitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{property.type}</Badge>
            <Badge>{property.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 sm:gap-x-0 sm:divide-x sm:divide-border">
            <Summary label={t("الوحدات")} value={String(row.units.length)} className="sm:pe-5" />
            <Summary label={t("مؤجرة")} value={`${row.rented}/${row.units.length}`} tone="text-success-700" className="sm:px-5" />
            <Summary label={t("الإيجار السنوي")} value={currency(row.income)} className="sm:px-5" />
            <Summary
              label={t("الدفعات المتأخرة")}
              value={row.overdue ? String(row.overdue) : t("لا يوجد")}
              tone={row.overdue ? "text-danger-700" : undefined}
              className="sm:ps-5"
            />
          </dl>
          <Facts
            items={[
              property.area ? { label: t("المساحة"), value: <span className="num">{property.area} م²</span> } : null,
              property.bedrooms ? { label: t("غرف النوم"), value: <span className="num">{property.bedrooms}</span> } : null,
              property.bathrooms ? { label: t("دورات المياه"), value: <span className="num">{property.bathrooms}</span> } : null,
              property.deedType ? { label: t("نوع الصك"), value: property.deedType } : null,
              property.deedIssueDate ? { label: t("تاريخ إصدار الصك"), value: <span className="num">{property.deedIssueDate}</span> } : null,
              property.managementEndDate ? { label: t("انتهاء إدارة العقار"), value: <span className="num">{property.managementEndDate}</span> } : null,
              meter(property.electricityMeterNumber, property.electricityMeterBilledTo)
                ? { label: t("عداد الكهرباء"), value: meter(property.electricityMeterNumber, property.electricityMeterBilledTo) }
                : null,
              meter(property.waterMeterNumber, property.waterMeterBilledTo)
                ? { label: t("عداد المياه"), value: meter(property.waterMeterNumber, property.waterMeterBilledTo) }
                : null,
            ]}
          />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold px-1">{single ? t("الوحدة") : t("الوحدات")}</h2>
        {row.units.map((u) => (
          <UnitCard key={u.key} u={u} t={t} docs={docsFor("وحدة", [u.key])} contractDocs={
            u.contract && !u.whole && !u.viaProperty ? docsFor("عقد", [u.contract.id]) : []
          } />
        ))}
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{single ? t("مستندات العقار والوحدة") : t("مستندات العقار")}</CardTitle>
            <CardSubtitle>الصكوك والتأمين والعقود المرتبطة بالعقار. تضيف الإدارة المستندات.</CardSubtitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <DocumentList documents={propertyDocs} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function Summary({ label, value, tone, className }: { label: string; value: string; tone?: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={`num mt-1 text-xl font-extrabold ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}

function UnitCard({
  u,
  t,
  docs,
  contractDocs,
}: {
  u: UnitRow;
  t: (s: string) => string;
  docs: DocumentLink[];
  contractDocs: DocumentLink[];
}) {
  const unit = u.unit;
  const c = u.contract;
  const upcoming = c
    ? (c.payments ?? [])
        .filter((p) => p.status !== "مسددة")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    : undefined;
  const allDocs = [...docs, ...contractDocs];

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold">{u.whole ? t("العقار كاملًا (وحدة واحدة)") : `${t("وحدة")} ${u.label}`}</h3>
            {u.detail && <p className="text-xs text-muted mt-0.5">{u.detail}</p>}
          </div>
          <Badge tone={u.status === "شاغرة" ? "warning" : undefined}>{u.status}</Badge>
        </div>

        <Facts
          items={[
            unit && unit.floor !== undefined ? { label: t("الطابق"), value: <span className="num">{unit.floor}</span> } : null,
            unit?.bedrooms ? { label: t("غرف النوم"), value: <span className="num">{unit.bedrooms}</span> } : null,
            unit?.bathrooms ? { label: t("دورات المياه"), value: <span className="num">{unit.bathrooms}</span> } : null,
            unit?.furnished !== undefined
              ? { label: t("التأثيث"), value: unit.furnished ? `${t("مفروشة")}${unit.furnitureCondition ? ` · ${unit.furnitureCondition}` : ""}` : t("غير مفروشة") }
              : null,
            unit && meter(unit.electricityMeterNumber, unit.electricityMeterBilledTo)
              ? { label: t("عداد الكهرباء"), value: meter(unit.electricityMeterNumber, unit.electricityMeterBilledTo) }
              : null,
            unit && meter(unit.waterMeterNumber, unit.waterMeterBilledTo)
              ? { label: t("عداد المياه"), value: meter(unit.waterMeterNumber, unit.waterMeterBilledTo) }
              : null,
          ]}
        />

        {unit?.amenities && unit.amenities.length > 0 && (
          <div>
            <p className="text-xs text-muted mb-1.5">{t("المرافق")}</p>
            <ul className="flex flex-wrap gap-1.5">
              {unit.amenities.map((a) => (
                <li key={a.name} className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium">
                  {a.name}
                  {a.count > 1 && <span className="num text-muted"> ×{a.count}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl bg-surface-sunken/60 p-3.5">
          <p className="text-xs font-semibold text-muted mb-2">{t("العقد الحالي")}</p>
          {c ? (
            <Facts
              items={[
                { label: t("المستأجر"), value: u.tenantName ?? "—" },
                {
                  label: t("الإيجار السنوي"),
                  value: u.viaProperty ? t("ضمن عقد العقار") : <span className="num">{currency(c.value)}</span>,
                },
                { label: t("دورة الدفع"), value: t(c.paymentCycle) },
                { label: t("بداية العقد"), value: <span className="num">{c.startDate}</span> },
                { label: t("ينتهي العقد"), value: <span className="num">{c.endDate}</span> },
                upcoming
                  ? {
                      label: t("أقرب دفعة غير مسددة"),
                      value: (
                        <span className="num">
                          {upcoming.dueDate} · {currency(upcoming.amount)}
                        </span>
                      ),
                    }
                  : null,
                u.overdue > 0 ? { label: t("الدفعات المتأخرة"), value: <span className="num text-danger-700">{u.overdue}</span> } : null,
              ]}
            />
          ) : (
            <p className="text-sm text-muted">{t("لا يوجد عقد نشط")}</p>
          )}
        </div>

        {!u.whole && (
          <div>
            <p className="text-xs font-semibold text-muted">{t("مستندات الوحدة")}</p>
            <DocumentList documents={allDocs} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
