"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Money } from "@/components/ui/Money";
import { CountUp } from "@/components/motion/CountUp";
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

  // Portfolio view: the PDF gives us the contractual schedule, while the
  // payment status is only trusted when it has been explicitly confirmed in
  // the system. Unknown/un-synced payments stay visible as "بانتظار التحقق".
  const allPayments = myContracts.flatMap((c) => c.payments ?? []);
  const paidPayments = allPayments.filter((p) => p.status === "مسددة");
  const overduePayments = allPayments.filter((p) => p.status !== "مسددة" && p.dueDate < new Date().toISOString().slice(0, 10));
  const outstandingAmount = allPayments.filter((p) => p.status !== "مسددة").reduce((sum, p) => sum + p.amount, 0);
  const occupiedPropertyIds = new Set(activeContracts.map((c) => c.propertyId));
  const vacantProperties = myProperties.filter((p) => !occupiedPropertyIds.has(p.id));
  const propertyRollup = myProperties.map((property) => ({
    property,
    contracts: activeContracts.filter((c) => c.propertyId === property.id),
    income: activeContracts.filter((c) => c.propertyId === property.id).reduce((sum, c) => sum + c.value, 0),
  }));

  const incomeByProperty = myProperties.map((p) => ({
    name: p.title.split(" ").slice(0, 2).join(" "),
    "الدخل السنوي": contracts.find((c) => c.propertyId === p.id)?.value ?? 0,
  }));

  return (
    <DashboardShell allow={["owner"]} title={`أهلًا، ${currentOwner.name}`}>
      <div className="flex flex-col gap-6">
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
            <dl className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.25fr] gap-x-4 gap-y-5 lg:gap-x-0 lg:divide-x lg:divide-border">
              <div className="lg:pe-6">
                <dt className="text-xs font-semibold text-muted">الدخل الإجمالي</dt>
                <dd className="num mt-1.5 text-xl lg:text-2xl font-extrabold">{currency(annualIncome)}</dd>
              </div>
              <div className="lg:px-6">
                <dt className="text-xs font-semibold text-muted flex items-center gap-1.5"><TrendingDown size={14} /> المصروفات</dt>
                <dd className="num mt-1.5 text-xl lg:text-2xl font-extrabold text-danger-700"><Money value={totalExpenses} negative /></dd>
              </div>
              <div className="lg:px-6">
                <dt className="text-xs font-semibold text-muted flex items-center gap-1.5"><Wallet size={14} /> عمولة الإدارة</dt>
                <dd className="num mt-1.5 text-xl lg:text-2xl font-extrabold text-warning-700"><Money value={managementFee} negative /></dd>
              </div>
              <div className="col-span-2 lg:col-span-1 rounded-xl bg-brand-800 text-white px-5 py-4 lg:ms-6 border-t-[5px] border-double border-brand-300/70">
                <dt className="text-xs font-semibold text-brand-200">صافي الدخل</dt>
                <dd className="mt-1.5">
                  <CountUp value={currency(netIncome)} className="num text-2xl lg:text-[1.75rem] font-extrabold" />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard label="عقاراتي" value={String(myProperties.length)} icon={Building2} tone="brand" />
          <StatCard label="عقود نشطة" value={String(activeContracts.length)} icon={FileText} tone="success" />
          <StatCard label="الدخل السنوي المتوقع" value={currency(annualIncome)} icon={TrendingUp} tone="brand" />
          <StatCard label="طلبات صيانة مفتوحة" value={String(openMaintenance.length)} icon={Wrench} tone="warning" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>ملخص المحفظة</CardTitle>
              <CardSubtitle>صورة سريعة عن الإشغال والتحصيل — حالة الدفع تعتمد على آخر مزامنة أو إثبات معتمد</CardSubtitle>
            </div>
            <Badge tone={overduePayments.length ? "danger" : "success"}>{overduePayments.length ? `${overduePayments.length} دفعة متأخرة` : "لا توجد دفعات متأخرة"}</Badge>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-x-0 sm:divide-x sm:divide-border">
              <div className="sm:pe-6"><dt className="text-xs font-semibold text-muted">وحدات مؤجرة</dt><dd className="num mt-1 text-xl font-extrabold text-success-700">{occupiedPropertyIds.size}</dd></div>
              <div className="sm:px-6"><dt className="text-xs font-semibold text-muted">عقارات شاغرة</dt><dd className="num mt-1 text-xl font-extrabold text-warning-700">{vacantProperties.length}</dd></div>
              <div className="sm:px-6"><dt className="text-xs font-semibold text-muted">دفعات مسددة</dt><dd className="num mt-1 text-xl font-extrabold text-brand-700">{paidPayments.length}</dd></div>
              <div className="sm:ps-6"><dt className="text-xs font-semibold text-muted">مبالغ تحتاج تحقق</dt><dd className="num mt-1 text-xl font-extrabold text-danger-700">{currency(outstandingAmount)}</dd></div>
            </dl>
            <div className="mt-5 overflow-x-auto"><Table><THead><Tr><Th>العقار / المجمع</Th><Th>العقود النشطة</Th><Th>الدخل المتوقع</Th><Th>الدفعات المتأخرة</Th></Tr></THead><TBody>{propertyRollup.map(({ property, contracts: propertyContracts, income }) => { const late = propertyContracts.flatMap((c) => c.payments ?? []).filter((p) => p.status !== "مسددة" && p.dueDate < new Date().toISOString().slice(0, 10)).length; return <Tr key={property.id}><Td className="font-semibold">{property.title}<span className="block text-xs font-normal text-muted">{property.city} · {property.district}</span></Td><Td>{propertyContracts.length}</Td><Td className="font-semibold">{currency(income)}</Td><Td><Badge tone={late ? "danger" : "success"}>{late ? String(late) : "لا يوجد"}</Badge></Td></Tr>; })}</TBody></Table></div>
          </CardContent>
        </Card>

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
              <ul className="flex flex-col divide-y divide-border -my-2">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-3 text-sm">
                    <div className="flex-1 min-w-0 flex flex-col items-start gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                      <Badge tone={n.type === "عقد قرب الانتهاء" ? "warning" : "info"} className="shrink-0">{n.type}</Badge>
                      <span className="leading-relaxed">{n.message}</span>
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      title="إخفاء هذا الإشعار"
                      aria-label="إخفاء هذا الإشعار"
                      className="pressable hit-44 grid place-items-center h-8 w-8 rounded-lg text-muted hover:text-danger-600 hover:bg-danger-50 shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <BarChartCard data={incomeByProperty} title="الدخل السنوي حسب العقار" dataKey="الدخل السنوي" color="#1a566a" />

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
