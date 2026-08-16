"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { BarChartCard } from "@/components/charts/Charts";
import { contractDisplayNumber } from "@/lib/contracts/display";
import { currency, DEFAULT_MANAGEMENT_FEE_RATE } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { computeNotifications } from "@/lib/notifications";
import { useDismissedNotifications } from "@/lib/use-dismissed-notifications";
import {
  useAppSettings,
  useContracts,
  useFirestoreDoc,
  useOwnerExpenses,
  useOwnerMaintenanceRequests,
  useOwnerProperties,
  useTechnicians,
  useTenants,
} from "@/lib/firestore/hooks";
import type { Owner } from "@/lib/types";
import { Bell, Building2, ChevronDown, ChevronUp, FileScan, FileText, TrendingDown, TrendingUp, Wallet, Wrench, X } from "lucide-react";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const currentOwner = useFirestoreDoc<Owner>("owners", user?.linkedId ?? undefined);
  const { data: properties } = useOwnerProperties(user?.linkedId ?? undefined);
  const { data: contracts } = useContracts();
  const { data: myMaintenance } = useOwnerMaintenanceRequests(user?.linkedId);
  const { data: myExpenses } = useOwnerExpenses(user?.linkedId);
  const { data: technicians } = useTechnicians();
  const { data: tenants } = useTenants();
  const settings = useAppSettings();
  const { isDismissed, dismiss } = useDismissedNotifications();

  if (!currentOwner) return null;

  // Already scoped at the query level (useOwnerProperties above) — no
  // client-side re-filter needed.
  const myProperties = properties;
  const myContracts = contracts.filter((c) => c.ownerId === currentOwner.id);
  const activeContracts = myContracts.filter((c) => c.status === "نشط");
  const annualIncome = activeContracts.reduce((sum, c) => sum + c.value, 0);
  const openMaintenance = myMaintenance.filter((m) => m.status !== "مكتمل");

  const allNotifications = computeNotifications(myContracts, myProperties, tenants, {
    contract: settings?.notificationLeadDays ?? 30,
    payment: 14,
  }).filter((n) => !isDismissed(n.id));
  const notifications = allNotifications.slice(0, 6);

  const totalExpenses = myExpenses.reduce((sum, e) => sum + e.amount, 0);
  const feeRate = currentOwner.managementFeeRate ?? DEFAULT_MANAGEMENT_FEE_RATE;
  const managementFee = Math.max(0, annualIncome - totalExpenses) * feeRate;
  const netIncome = annualIncome - totalExpenses - managementFee;

  const incomeByProperty = myProperties.map((p) => ({
    name: p.title.split(" ").slice(0, 2).join(" "),
    "الدخل السنوي": contracts.find((c) => c.propertyId === p.id)?.value ?? 0,
  }));

  return (
    <DashboardShell allow={["owner"]} title={`أهلًا، ${currentOwner.name}`}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="عقاراتي" value={String(myProperties.length)} icon={Building2} tone="brand" />
          <StatCard label="عقود نشطة" value={String(activeContracts.length)} icon={FileText} tone="success" />
          <StatCard label="الدخل السنوي المتوقع" value={currency(annualIncome)} icon={TrendingUp} tone="accent" />
          <StatCard label="طلبات صيانة مفتوحة" value={String(openMaintenance.length)} icon={Wrench} tone="warning" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-1.5"><Bell size={16} /> الإشعارات</CardTitle>
              <CardSubtitle>عقود قرب الانتهاء ودفعات مستحقة على عقاراتي، الأقدم أولًا</CardSubtitle>
            </div>
            {allNotifications.length > notifications.length && (
              <span className="text-xs font-semibold text-muted">+{allNotifications.length - notifications.length} أخرى</span>
            )}
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted py-2">لا توجد إشعارات حاليًا</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 text-sm">
                    <Badge tone={n.type === "عقد قرب الانتهاء" ? "warning" : "info"}>{n.type}</Badge>
                    <span className="flex-1">{n.message}</span>
                    <button
                      onClick={() => dismiss(n.id)}
                      title="إخفاء هذا الإشعار"
                      className="text-muted hover:text-danger-500 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>كشف حسابي</CardTitle>
              <CardSubtitle>صافي الدخل بعد المصروفات وعمولة الإدارة ({Math.round(feeRate * 100)}%)</CardSubtitle>
            </div>
            <Link href="/owner/statement/print" target="_blank">
              <Button size="sm" variant="outline">
                <FileScan size={15} /> طباعة كشف الحساب
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted mb-1.5">الدخل الإجمالي</p>
                <p className="text-lg font-extrabold">{currency(annualIncome)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted mb-1.5 flex items-center gap-1"><TrendingDown size={13} /> المصروفات</p>
                <p className="text-lg font-extrabold text-danger-700">-{currency(totalExpenses)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted mb-1.5 flex items-center gap-1"><Wallet size={13} /> عمولة الإدارة</p>
                <p className="text-lg font-extrabold text-warning-700">-{currency(managementFee)}</p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                <p className="text-xs text-brand-700 mb-1.5">صافي الدخل</p>
                <p className="text-lg font-extrabold text-brand-700">{currency(netIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <BarChartCard data={incomeByProperty} title="الدخل السنوي حسب العقار" dataKey="الدخل السنوي" color="#1c3ab3" />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>عقاراتي</CardTitle>
              <CardSubtitle>{myProperties.length} عقار مملوك</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>العقار</Th>
                  <Th>المدينة</Th>
                  <Th>النوع</Th>
                  <Th>السعر</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myProperties.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-semibold">{p.title}</Td>
                    <Td className="text-muted">{p.city} · {p.district}</Td>
                    <Td>{p.type}</Td>
                    <Td className="font-semibold">{currency(p.price)}</Td>
                    <Td><Badge>{p.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>عقودي</CardTitle>
              <CardSubtitle>{myContracts.length} عقد إجمالي</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>رقم العقد</Th>
                  <Th>القيمة</Th>
                  <Th>البداية</Th>
                  <Th>النهاية</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myContracts.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-semibold text-brand-700">{contractDisplayNumber(c)}</Td>
                    <Td className="font-semibold">{currency(c.value)}</Td>
                    <Td className="text-muted">{c.startDate}</Td>
                    <Td className="text-muted">{c.endDate}</Td>
                    <Td><Badge>{c.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>طلبات الصيانة على عقاراتي</CardTitle>
              <CardSubtitle>{myMaintenance.length} طلب</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th>الطلب</Th>
                  <Th>الأولوية</Th>
                  <Th>الفني</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myMaintenance.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-muted py-6">لا توجد طلبات صيانة حاليًا</Td>
                  </Tr>
                )}
                {myMaintenance.map((m) => (
                  <Tr key={m.id}>
                    <Td className="font-semibold">{m.title}</Td>
                    <Td><Badge>{m.priority}</Badge></Td>
                    <Td className="text-muted">{technicians.find((t) => t.id === m.technicianId)?.name ?? "غير معيّن"}</Td>
                    <Td><Badge>{m.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>المصروفات على عقاراتي</CardTitle>
              <CardSubtitle>{myExpenses.length} مصروف</CardSubtitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <Tr>
                  <Th></Th>
                  <Th>الفئة</Th>
                  <Th>المورّد</Th>
                  <Th>المبلغ</Th>
                  <Th>التاريخ</Th>
                  <Th>الحالة</Th>
                </Tr>
              </THead>
              <TBody>
                {myExpenses.length === 0 && (
                  <Tr>
                    <Td colSpan={6} className="text-center text-muted py-6">لا توجد مصروفات مسجّلة</Td>
                  </Tr>
                )}
                {myExpenses.map((e) => {
                  const isOpen = expandedExpenseId === e.id;
                  return (
                    <Fragment key={e.id}>
                      <Tr className="cursor-pointer" onClick={() => setExpandedExpenseId(isOpen ? null : e.id)}>
                        <Td className="w-8 text-muted">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Td>
                        <Td className="font-semibold">{e.category}</Td>
                        <Td className="text-muted">{e.vendorName ?? "—"}</Td>
                        <Td className="font-semibold">{currency(e.amount)}</Td>
                        <Td className="text-muted">{e.date}</Td>
                        <Td><Badge>{e.status}</Badge></Td>
                      </Tr>
                      {isOpen && (
                        <Tr className="bg-background">
                          <Td colSpan={6} className="py-3 whitespace-normal align-top">
                            <div className="pr-8">
                              <p className="text-xs font-semibold text-muted mb-2">تفصيل المبلغ ({e.items?.length ?? 0} بند)</p>
                              <table className="w-full text-sm max-w-md">
                                <tbody>
                                  {(e.items ?? []).map((item, idx) => (
                                    <tr key={idx} className="border-b border-border/60">
                                      <td className="py-1.5 text-muted">{item.description}</td>
                                      <td className="py-1.5 text-left font-medium">{currency(item.amount)}</td>
                                    </tr>
                                  ))}
                                  <tr>
                                    <td className="py-1.5 font-semibold">الإجمالي</td>
                                    <td className="py-1.5 text-left font-bold text-brand-700">{currency(e.amount)}</td>
                                  </tr>
                                </tbody>
                              </table>
                              {e.notes && <p className="text-xs text-muted mt-2">ملاحظات: {e.notes}</p>}
                            </div>
                          </Td>
                        </Tr>
                      )}
                    </Fragment>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
