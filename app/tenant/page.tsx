"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { currency } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  useFirestoreDoc,
  useMyMaintenanceRequests,
  useTenantInvoices,
} from "@/lib/firestore/hooks";
import type { Contract, Property, Tenant } from "@/lib/types";
import { CalendarClock, CheckCircle2, CreditCard, FileText, Receipt, Wrench } from "lucide-react";

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const currentTenant = useFirestoreDoc<Tenant>("tenants", user?.linkedId ?? undefined);
  // A single get-by-id, not a list — matches firestore.rules' tenant
  // scoping on contracts (resource.data.tenantId == myProfile().linkedId),
  // which only proves access to this one contract, not the whole collection.
  const contract = useFirestoreDoc<Contract>("contracts", currentTenant?.contractId);
  const property = useFirestoreDoc<Property>("properties", currentTenant?.propertyId);
  const { data: myInvoices } = useTenantInvoices(user?.linkedId ?? undefined);
  const { data: myMaintenance } = useMyMaintenanceRequests(user?.uid);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paidRefs, setPaidRefs] = useState<Record<string, string>>({});

  if (!currentTenant) return null;

  const openMaintenance = myMaintenance.filter((m) => m.status !== "مكتمل");
  const pendingInvoice = myInvoices.find((i) => i.status !== "مدفوعة");

  async function handleConfirmPay(paymentId: string) {
    if (!contract) return;
    setPaySubmitting(true);
    setPayError(null);
    try {
      const idToken = await getFirebaseAuth().currentUser?.getIdToken();
      const res = await fetch("/api/tenant-payments/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ contractId: contract.id, paymentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل الدفع");
      setPaidRefs((r) => ({ ...r, [paymentId]: json.reference }));
      setPayingId(null);
    } catch {
      setPayError("تعذّر إتمام الدفع التجريبي — حاول مرة أخرى");
    } finally {
      setPaySubmitting(false);
    }
  }

  const daysLeft = contract
    ? Math.max(0, Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <DashboardShell allow={["tenant"]} title={`أهلًا، ${currentTenant.name}`}>
      <div className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="الأيام المتبقية للعقد" value={String(daysLeft)} icon={CalendarClock} tone="brand" />
          <StatCard label="قيمة العقد" value={contract ? currency(contract.value) : "—"} icon={FileText} tone="info" />
          <StatCard label="فاتورة مستحقة" value={pendingInvoice ? currency(pendingInvoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)) : "لا يوجد"} icon={Receipt} tone="warning" />
          <StatCard label="طلبات صيانة نشطة" value={String(openMaintenance.length)} icon={Wrench} tone="accent" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>عقد الإيجار الحالي</CardTitle>
              <CardSubtitle>تفاصيل العقار والعقد المرتبط بحسابك</CardSubtitle>
            </div>
            {contract && <Badge>{contract.status}</Badge>}
          </CardHeader>
          <CardContent>
            {property && contract ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted mb-1">العقار</p>
                  <p className="font-semibold">{property.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">الموقع</p>
                  <p className="font-semibold">{property.city} · {property.district}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">تاريخ البداية</p>
                  <p className="font-semibold">{contract.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">تاريخ الانتهاء</p>
                  <p className="font-semibold">{contract.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">دورة الدفع</p>
                  <p className="font-semibold">{contract.paymentCycle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">قيمة العقد</p>
                  <p className="font-semibold">{currency(contract.value)}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted text-sm">لا يوجد عقد نشط حاليًا</p>
            )}
          </CardContent>
        </Card>

        {contract && contract.payments.length > 0 && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>جدول الدفعات</CardTitle>
                <CardSubtitle>سداد إلكتروني تجريبي — لا يتم تحصيل أي مبالغ حقيقية</CardSubtitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <Tr>
                    <Th>تاريخ الاستحقاق</Th>
                    <Th>المبلغ</Th>
                    <Th>الحالة</Th>
                    <Th></Th>
                  </Tr>
                </THead>
                <TBody>
                  {contract.payments.map((p) => {
                    const paidRef = paidRefs[p.id];
                    const isPaid = p.status === "مسددة" || !!paidRef;
                    return (
                      <Tr key={p.id}>
                        <Td className="text-muted">{p.dueDate}</Td>
                        <Td className="font-semibold">{currency(p.amount)}</Td>
                        <Td><Badge>{isPaid ? "مسددة" : "مستحقة"}</Badge></Td>
                        <Td>
                          {isPaid ? (
                            paidRef && (
                              <span className="inline-flex items-center gap-1 text-xs text-success-700">
                                <CheckCircle2 size={13} /> مرجع: {paidRef}
                              </span>
                            )
                          ) : payingId === p.id ? (
                            <div className="flex flex-col gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 max-w-xs">
                              <p className="text-xs font-semibold text-brand-700">بيئة دفع تجريبية — لا يتم تحصيل أي مبالغ حقيقية</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button size="sm" disabled={paySubmitting} onClick={() => handleConfirmPay(p.id)}>
                                  {paySubmitting ? "جارِ المعالجة..." : "تأكيد الدفع التجريبي"}
                                </Button>
                                <Button size="sm" variant="outline" disabled={paySubmitting} onClick={() => setPayingId(null)}>
                                  إلغاء
                                </Button>
                              </div>
                              {payError && <p className="text-xs text-danger-500">{payError}</p>}
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => { setPayingId(p.id); setPayError(null); }}>
                              <CreditCard size={14} /> ادفع الآن
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>فواتيري</CardTitle>
                <CardSubtitle>{myInvoices.length} فاتورة</CardSubtitle>
              </div>
              <Link href="/reports" className="text-xs font-semibold text-brand-700 hover:underline">عرض الكل</Link>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <Tr>
                    <Th>الرقم</Th>
                    <Th>المبلغ</Th>
                    <Th>الاستحقاق</Th>
                    <Th>الحالة</Th>
                  </Tr>
                </THead>
                <TBody>
                  {myInvoices.map((inv) => (
                    <Tr key={inv.id}>
                      <Td className="font-semibold text-brand-700">{inv.number}</Td>
                      <Td className="font-semibold">{currency(inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</Td>
                      <Td className="text-muted">{inv.dueDate}</Td>
                      <Td><Badge>{inv.status}</Badge></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>طلبات الصيانة</CardTitle>
                <CardSubtitle>{myMaintenance.length} طلب</CardSubtitle>
              </div>
              <Link href="/tenant/maintenance">
                <Button size="sm">طلب صيانة جديد</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <Tr>
                    <Th>الطلب</Th>
                    <Th>الأولوية</Th>
                    <Th>الحالة</Th>
                  </Tr>
                </THead>
                <TBody>
                  {myMaintenance.length === 0 && (
                    <Tr>
                      <Td colSpan={3} className="text-center text-muted py-6">لا توجد طلبات صيانة</Td>
                    </Tr>
                  )}
                  {myMaintenance.map((m) => (
                    <Tr key={m.id}>
                      <Td className="font-semibold">{m.title}</Td>
                      <Td><Badge>{m.priority}</Badge></Td>
                      <Td><Badge>{m.status}</Badge></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
