"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { parseEjarPdf, type ParsedEjarContract } from "@/lib/rega/parseEjarContract";
import { CheckCircle2, FileText, Loader2, Upload, XCircle } from "lucide-react";

type Imported = { name: string; data: ParsedEjarContract | null; error?: string };

export default function EjarBatchImportPage() {
  const [items, setItems] = useState<Imported[]>([]);
  const [busy, setBusy] = useState(false);

  async function importFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    const parsed = await Promise.all(files.map(async (file) => {
      const data = await parseEjarPdf(file);
      return { name: file.name, data, error: data ? undefined : "تعذر قراءة حقول عقد إيجار" };
    }));
    setItems((current) => [...current, ...parsed]);
    setBusy(false);
  }

  const valid = items.filter((item) => item.data);
  const payments = valid.flatMap((item) => item.data?.payments ?? []);
  const paid = payments.filter((payment) => payment.status === "مسددة").length;

  return <DashboardShell allow={["admin", "leasingAgent"]} title="استيراد عقود إيجار">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <Card className="border-brand-200 bg-brand-50/60">
        <CardHeader><div><CardTitle>استيراد عقود المالك دفعة واحدة</CardTitle><CardSubtitle>ارفع ملفات PDF التي نزّلها المالك من إيجار. تتم القراءة على جهازك ولا نطلب رقم الهوية أو نفاذ.</CardSubtitle></div></CardHeader>
        <CardContent><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-surface px-5 text-center hover:bg-brand-50"><Upload className="text-brand-600" /><span className="font-bold text-brand-700">اختر ملفات عقود إيجار</span><span className="text-xs text-muted">يمكن اختيار عدة ملفات PDF في مرة واحدة</span><input type="file" accept="application/pdf" multiple className="hidden" onChange={importFiles} disabled={busy} /></label>{busy && <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> جارٍ قراءة العقود على الجهاز...</p>}</CardContent>
      </Card>

      {items.length > 0 && <><div className="grid gap-3 sm:grid-cols-3"><Stat label="الملفات" value={String(items.length)} /><Stat label="عقود مقروءة" value={String(valid.length)} /><Stat label="دفعات مسجلة" value={`${paid} / ${payments.length}`} /></div><Card><CardHeader><div><CardTitle>مراجعة العقود</CardTitle><CardSubtitle>راجع البيانات قبل اعتمادها في النظام</CardSubtitle></div><Button size="sm" disabled={!valid.length}>اعتماد العقود المقروءة</Button></CardHeader><CardContent><div className="flex flex-col gap-3">{items.map((item) => item.data ? <div key={item.name} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><FileText size={18} className="text-brand-600" /><div><p className="font-bold">{item.data.externalContractNo ?? item.name}</p><p className="text-xs text-muted">{item.data.tenantName ?? "مستأجر غير مستخرج"}</p></div></div><Badge tone="success">جاهز للمراجعة</Badge></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5"><Field label="القيمة" value={item.data.totalValue ? `${item.data.totalValue.toLocaleString("ar-SA")} ر.س` : "—"} /><Field label="البداية" value={item.data.startDate ?? "—"} /><Field label="النهاية" value={item.data.endDate ?? "—"} /><Field label="الدورية" value={item.data.paymentCycle ?? "—"} /><Field label="الدفعات" value={String(item.data.payments?.length ?? 0)} /></div><div className="mt-4 flex flex-wrap gap-2">{(item.data.payments ?? []).slice(0, 8).map((payment) => <span key={payment.id} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${payment.status === "مسددة" ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>{payment.dueDate} · {payment.amount.toLocaleString("ar-SA")} ر.س · {payment.status}</span>)}</div></div> : <div key={item.name} className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700"><XCircle size={18} /><span>{item.name}: {item.error}</span></div>)}</div></CardContent></Card></>}
    </div>
  </DashboardShell>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>; }
function Field({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted">{label}</p><p className="mt-1 font-bold">{value}</p></div>; }
