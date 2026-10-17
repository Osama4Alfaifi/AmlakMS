"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { useContracts } from "@/lib/firestore/hooks";
import { updateContractPayments } from "@/lib/firestore/mutations";
import { contractDisplayNumber } from "@/lib/contracts/display";
import type { ContractPayment } from "@/lib/types";
import { CheckCircle2, ClipboardPaste, Receipt, Search } from "lucide-react";

type Source = NonNullable<ContractPayment["paymentSource"]>;

export default function PaymentsPage() {
  const { data: contracts } = useContracts();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ contractId: string; payment: ContractPayment } | null>(null);
  const [source, setSource] = useState<Source>("تحويل بنكي");
  const [bankMessage, setBankMessage] = useState("");
  const [bankName, setBankName] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");

  const rows = useMemo(() => contracts.flatMap((contract) => (contract.payments ?? []).filter((payment) => payment.status !== "مسددة").map((payment) => ({ contract, payment }))).filter(({ contract, payment }) => `${contractDisplayNumber(contract)} ${payment.dueDate}`.includes(query)), [contracts, query]);

  function parseBankMessage() {
    const amount = bankMessage.match(/(?:SAR|ر\.س|ريال)\s*([\d,]+(?:\.\d{1,2})?)/i)?.[1] ?? bankMessage.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:SAR|ر\.س|ريال)/i)?.[1];
    const ref = bankMessage.match(/(?:reference|مرجع|رقم العملية)\s*[:#]?\s*([\w-]+)/i)?.[1];
    const bank = bankMessage.match(/(الراجحي|الأهلي|الإنماء|البلاد|الرياض|ساب|العربي)/)?.[1];
    if (ref) setReference(ref);
    if (bank) setBankName(bank);
    setNotice(amount ? `تم التعرف على مبلغ محتمل: ${amount} — راجعه قبل الاعتماد.` : "لم أجد مبلغًا واضحًا؛ أدخله يدويًا ثم راجع البيانات.");
  }

  async function confirmPayment() {
    if (!selected) return;
    const now = new Date().toISOString();
    const contract = contracts.find((item) => item.id === selected.contractId);
    if (!contract) return;
    const updated = (contract.payments ?? []).map((payment) => payment.id === selected.payment.id ? { ...payment, status: "مسددة" as const, paidAt: now.slice(0, 10), paymentSource: source, bankName: source === "تحويل بنكي" ? bankName || undefined : undefined, reference: reference || undefined, note: note || undefined, confirmedAt: now } : payment);
    await updateContractPayments(contract.id, updated, `تأكيد دفعة ${selected.payment.amount.toLocaleString("ar-SA")} ر.س عبر ${source}`);
    setSelected(null); setBankMessage(""); setBankName(""); setReference(""); setNote(""); setNotice("تم اعتماد الدفعة وتسجيل مصدرها.");
  }

  return <DashboardShell allow={["admin", "leasingAgent"]} title="متابعة الدفعات"><div className="flex flex-col gap-5"><Card><CardHeader><div><CardTitle>الدفعات التي تحتاج متابعة</CardTitle><CardSubtitle>لا يتم اعتبار التحويل أو الكاش مدفوعًا إلا بعد اعتماد المستخدم وإثبات مصدره.</CardSubtitle></div><div className="relative w-full sm:w-64"><Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث برقم العقد..." className="pe-9" /></div></CardHeader><CardContent><div className="flex flex-col gap-2">{rows.map(({ contract, payment }) => <div key={`${contract.id}-${payment.id}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4"><div className="flex-1"><p className="font-bold">{contractDisplayNumber(contract)}</p><p className="text-xs text-muted">استحقاق {payment.dueDate} · {payment.amount.toLocaleString("ar-SA")} ر.س</p></div><Badge tone={payment.dueDate < new Date().toISOString().slice(0, 10) ? "danger" : "warning"}>{payment.dueDate < new Date().toISOString().slice(0, 10) ? "متأخرة" : "بانتظار التحقق"}</Badge><Button size="sm" onClick={() => { setSelected({ contractId: contract.id, payment }); setSource("تحويل بنكي"); }}>{payment.dueDate < new Date().toISOString().slice(0, 10) ? "تسجيل السداد" : "تأكيد الدفع"}</Button></div>)}{!rows.length && <p className="py-8 text-center text-sm text-muted">لا توجد دفعات تحتاج متابعة</p>}</div></CardContent></Card>
    {selected && <Card className="border-brand-200"><CardHeader><div><CardTitle>تأكيد دفعة {selected.payment.amount.toLocaleString("ar-SA")} ر.س</CardTitle><CardSubtitle>العقد {contractDisplayNumber(contracts.find((item) => item.id === selected.contractId)!)}</CardSubtitle></div></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2"><div><Label>مصدر الدفع</Label><select value={source} onChange={(event) => setSource(event.target.value as Source)} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"><option>تحويل بنكي</option><option>كاش</option><option>إيصال</option><option>إيجار</option></select></div>{source === "تحويل بنكي" && <div><Label>اسم البنك</Label><Input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="مثال: الراجحي" /></div>}<div className="sm:col-span-2"><Label>رسالة البنك أو ملاحظات الإثبات</Label><Textarea value={bankMessage} onChange={(event) => setBankMessage(event.target.value)} placeholder="الصق رسالة الحوالة هنا للتحليل المبدئي..." /><Button type="button" variant="secondary" size="sm" className="mt-2" onClick={parseBankMessage}><ClipboardPaste size={14} /> تحليل الرسالة</Button>{notice && <p className="mt-2 text-xs font-semibold text-brand-700">{notice}</p>}</div><div><Label>المرجع / رقم العملية</Label><Input value={reference} onChange={(event) => setReference(event.target.value)} /></div><div><Label>ملاحظة</Label><Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="اختياري" /></div></div><div className="mt-5 flex flex-wrap gap-2"><Button onClick={confirmPayment}><CheckCircle2 size={15} /> اعتماد الدفعة</Button><Button variant="outline" onClick={() => setSelected(null)}>إلغاء</Button></div></CardContent></Card>}
  </div></DashboardShell>;
}
