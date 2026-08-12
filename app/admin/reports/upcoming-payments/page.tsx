"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useAccountantOwnerScope } from "@/lib/accountant-scope";
import { contractDisplayNumber } from "@/lib/contracts/display";
import { currency } from "@/lib/mock-data";
import { downloadCsv } from "@/lib/csv";
import { downloadExcel } from "@/lib/excel";
import { useOwnerContracts, useOwnerProperties, useOwners, useTenants } from "@/lib/firestore/hooks";
import { Download, FileSpreadsheet } from "lucide-react";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function UpcomingPaymentsPage() {
  const scope = useAccountantOwnerScope();
  const { data: contracts } = useOwnerContracts(scope.queryOwnerId);
  const { data: properties } = useOwnerProperties(scope.queryOwnerId);
  const { data: owners } = useOwners();
  const { data: tenants } = useTenants();
  const [month, setMonth] = useState(currentMonth());

  const propertyTitleById = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties]);
  const tenantNameById = useMemo(() => new Map(tenants.map((t) => [t.id, t.name])), [tenants]);

  const rows = useMemo(
    () =>
      contracts.flatMap((c) =>
        (c.payments ?? [])
          .filter((p) => p.dueDate.startsWith(month))
          .map((p) => ({
            key: `${c.id}-${p.id}`,
            contractLabel: contractDisplayNumber(c),
            propertyTitle: propertyTitleById.get(c.propertyId) ?? "—",
            ownerName: owners.find((o) => o.id === c.ownerId)?.name ?? "—",
            tenantName: tenantNameById.get(c.tenantId) ?? "—",
            paymentNumber: p.id,
            amount: p.amount,
            status: p.status,
            dueDate: p.dueDate,
          }))
      ).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [contracts, month, propertyTitleById, owners, tenantNameById]
  );

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const paid = rows.filter((r) => r.status === "مسددة").reduce((s, r) => s + r.amount, 0);
  const unpaid = total - paid;

  const exportRows = () =>
    rows.map((r) => ({
      "رقم العقد": r.contractLabel,
      العقار: r.propertyTitle,
      المالك: r.ownerName,
      المستأجر: r.tenantName,
      "رقم الدفعة": r.paymentNumber,
      المبلغ: r.amount,
      الحالة: r.status,
      "تاريخ الاستحقاق": r.dueDate,
    }));

  return (
    <DashboardShell allow={["admin", "accountant"]} title="الدفعات القادمة">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>الدفعات القادمة لكل شهر</CardTitle>
              <CardSubtitle>كل الدفعات المستحقة عبر جميع العقارات دفعة واحدة، بحسب الشهر</CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="umonth" className="mb-0">الشهر</Label>
                <Input id="umonth" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadCsv("الدفعات القادمة", exportRows())}>
                <Download size={15} /> تصدير CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadExcel("الدفعات القادمة", "الدفعات", exportRows())}>
                <FileSpreadsheet size={15} /> تصدير Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted mb-1">إجمالي دفعات الشهر</p>
                <p className="text-lg font-bold">{currency(total)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted mb-1">مسدد</p>
                <p className="text-lg font-bold text-success-700">{currency(paid)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted mb-1">غير مسدد</p>
                <p className="text-lg font-bold text-danger-700">{currency(unpaid)}</p>
              </div>
            </div>
            <Table>
              <THead>
                <Tr>
                  <Th>رقم العقد</Th>
                  <Th>العقار</Th>
                  <Th>المالك</Th>
                  <Th>المستأجر</Th>
                  <Th>رقم الدفعة</Th>
                  <Th>المبلغ</Th>
                  <Th>الحالة</Th>
                  <Th>تاريخ الاستحقاق</Th>
                </Tr>
              </THead>
              <TBody>
                {rows.length === 0 && (
                  <Tr>
                    <Td colSpan={8} className="text-center text-muted py-6">لا توجد دفعات مستحقة هذا الشهر</Td>
                  </Tr>
                )}
                {rows.map((r) => (
                  <Tr key={r.key}>
                    <Td className="font-semibold text-brand-700">{r.contractLabel}</Td>
                    <Td className="max-w-[160px] truncate">{r.propertyTitle}</Td>
                    <Td className="text-muted">{r.ownerName}</Td>
                    <Td className="text-muted">{r.tenantName}</Td>
                    <Td>{r.paymentNumber}</Td>
                    <Td className="font-semibold">{currency(r.amount)}</Td>
                    <Td><Badge>{r.status}</Badge></Td>
                    <Td className="text-muted">{r.dueDate}</Td>
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
