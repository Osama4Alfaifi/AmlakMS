"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Input";
import { accountManagers, clients } from "@/lib/mock-data";
import { CheckCircle2, Clock, Mail, MessageSquare, Phone, Users } from "lucide-react";

const manager = accountManagers[0];

export default function AccountManagerPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <DashboardShell allow={["admin", "owner", "tenant"]} title="مدير الحساب">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-3">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-extrabold"
              style={{ backgroundColor: manager.color }}
            >
              {manager.name.charAt(0)}
            </div>
            <div>
              <p className="font-extrabold text-lg">{manager.name}</p>
              <p className="text-sm text-muted">{manager.title}</p>
            </div>
            <p className="text-sm text-muted leading-relaxed">{manager.bio}</p>

            <div className="w-full flex flex-col gap-2.5 mt-3 text-sm">
              <a href={`tel:${manager.phone}`} className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 hover:bg-background transition-colors">
                <Phone size={16} className="text-brand-600" />
                <span dir="ltr">{manager.phone}</span>
              </a>
              <a href={`mailto:${manager.email}`} className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5 hover:bg-background transition-colors">
                <Mail size={16} className="text-brand-600" />
                <span dir="ltr">{manager.email}</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm shadow-black/[0.03]">
              <Clock className="mx-auto text-brand-600 mb-2" size={20} />
              <p className="text-xl font-extrabold">15 دقيقة</p>
              <p className="text-xs text-muted mt-1">متوسط زمن الاستجابة</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm shadow-black/[0.03]">
              <Users className="mx-auto text-brand-600 mb-2" size={20} />
              <p className="text-xl font-extrabold">{clients.length}</p>
              <p className="text-xs text-muted mt-1">عملاء تحت المتابعة</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm shadow-black/[0.03]">
              <CheckCircle2 className="mx-auto text-brand-600 mb-2" size={20} />
              <p className="text-xl font-extrabold">98%</p>
              <p className="text-xs text-muted mt-1">معدل رضا العملاء</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>تواصل مباشر</CardTitle>
                <CardSubtitle>أرسل رسالة وسيتم الرد عليك خلال دقائق</CardSubtitle>
              </div>
              <MessageSquare size={18} className="text-brand-600" />
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="message">رسالتك</Label>
                  <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب رسالتك هنا..." />
                </div>
                <Button type="submit" className="self-start">إرسال</Button>
                {sent && (
                  <p className="flex items-center gap-1.5 text-success-700 text-xs font-semibold">
                    <CheckCircle2 size={15} /> تم إرسال رسالتك بنجاح
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
