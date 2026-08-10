"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, KeyRound, ShieldCheck, UserCog, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { roleMeta } from "@/components/layout/nav-config";
import type { Role } from "@/lib/types";
import { owners, technicians, tenants } from "@/lib/mock-data";

const DEMO_PASSWORD = "demo1234";

const roleOptions: { role: Role; icon: typeof ShieldCheck; demoEmail: string }[] = [
  { role: "admin", icon: UserCog, demoEmail: "admin@amlakms.sa" },
  { role: "owner", icon: ShieldCheck, demoEmail: owners[0].email },
  { role: "tenant", icon: KeyRound, demoEmail: tenants[0].email },
  { role: "technician", icon: Wrench, demoEmail: `${technicians[0].id}@amlakms.sa` },
];

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const preselected = params.get("role") as Role | null;
  const next = params.get("next");

  const [role, setRole] = useState<Role>(preselected ?? "admin");
  const active = roleOptions.find((r) => r.role === role)!;
  const [email, setEmail] = useState(active.demoEmail);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function selectRole(r: Role) {
    setRole(r);
    setEmail(roleOptions.find((o) => o.role === r)!.demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push(next || roleMeta[role].homeHref);
    } catch {
      setError("تعذّر تسجيل الدخول — تحقق من البريد الإلكتروني وكلمة المرور.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
            <Building2 size={20} />
          </div>
          <span className="text-lg font-extrabold">أملاك MS</span>
        </Link>

        <div className="bg-surface border border-border rounded-2xl shadow-sm shadow-black/[0.03] p-6 lg:p-8">
          <h1 className="text-xl font-extrabold text-center">تسجيل الدخول</h1>
          <p className="text-xs text-muted text-center mt-1.5">
            حسابات Firebase Authentication حقيقية (بيئة تجريبية محليًا) — اختر دورًا لتعبئة بيانات حساب تجريبي،
            أو أدخل بريدك الخاص إن كان لديك حساب.
          </p>

          <div className="grid grid-cols-4 gap-2 mt-6">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = role === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => selectRole(opt.role)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-border text-muted hover:bg-background"
                  }`}
                >
                  <Icon size={18} />
                  {roleMeta[opt.role].title.replace("بوابة ", "")}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted mt-1.5">كلمة مرور جميع الحسابات التجريبية: {DEMO_PASSWORD}</p>
            </div>
            {error && <p className="text-xs font-semibold text-danger-500">{error}</p>}
            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting ? "جارِ الدخول..." : `الدخول إلى ${roleMeta[role].title}`}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-5">
          <Link href="/" className="hover:text-brand-700">
            العودة للصفحة الرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
}
