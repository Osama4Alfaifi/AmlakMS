"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Calculator, type LucideIcon, Users, KeyRound, ShieldCheck, UserCog, UserPlus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";
import { LangToggle, ThemeToggle } from "@/components/layout/Toggles";
import { useT } from "@/lib/i18n";
import { Input, Label } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { roleMeta } from "@/components/layout/nav-config";
import type { Role } from "@/lib/types";
import { owners, technicians, tenants } from "@/lib/mock-data";

// TEMPORARY, deliberate during active development (real Firebase project,
// not just the emulator) — user-acknowledged tradeoff, to be removed before
// the project is finalized/launched. Do not "fix" this without being asked.
const DEMO_PASSWORD = "demo1234";

const roleOptions: { role: Role; icon: LucideIcon; demoEmail: string }[] = [
  { role: "admin", icon: UserCog, demoEmail: "admin@amlakms.sa" },
  { role: "owner", icon: Building2, demoEmail: owners[0].email ?? "" },
  { role: "tenant", icon: KeyRound, demoEmail: tenants[0].email ?? "" },
  { role: "technician", icon: Wrench, demoEmail: `${technicians[0].id}@amlakms.sa` },
  { role: "accountant", icon: Calculator, demoEmail: "accountant@amlakms.sa" },
  { role: "leasingAgent", icon: UserPlus, demoEmail: "agent@amlakms.sa" },
  { role: "maintenanceStaff", icon: Users, demoEmail: "maintenance-lead@amlakms.sa" },
  // No single demo persona — custom roles are provisioned per real account
  // by an admin (see app/admin/users). Selecting this tile just clears the
  // email field for manual entry.
  { role: "custom", icon: ShieldCheck, demoEmail: "" },
];

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const t = useT();

  const preselected = params.get("role") as Role | null;
  const next = params.get("next");

  const [role, setRole] = useState<Role>(preselected ?? "owner");
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
      setError(t("تعذّر تسجيل الدخول — تحقق من البريد الإلكتروني وكلمة المرور."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] xl:grid-cols-[minmax(0,1fr)_34rem]">
      <aside className="hidden lg:flex flex-col justify-between bg-brand-950 text-white p-12 xl:p-16">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <LogoMark size={40} />
          <span className="text-lg font-extrabold">{t("أملاك MS")}</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-4xl font-extrabold leading-[1.25]">{t("كل ما يخص عقارك، في كشف واحد واضح.")}</h2>
          <p className="mt-5 text-white/75 leading-relaxed">
            {t("العقود والتحصيل والصيانة وصافي الدخل بعد المصروفات وعمولة الإدارة — محدّثة أولًا بأول لكل دور بصلاحياته.")}
          </p>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} {t("أملاك MS")}</p>
      </aside>

      <main className="relative flex items-center justify-center p-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="absolute top-3 end-3 flex items-center gap-1 pt-[env(safe-area-inset-top)]">
          <ThemeToggle />
          <LangToggle />
        </div>
        <div className="w-full max-w-md">
          <Link href="/" className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <LogoMark size={38} />
            <span className="text-lg font-extrabold">{t("أملاك MS")}</span>
          </Link>

          <h1 className="text-2xl font-extrabold">{t("تسجيل الدخول")}</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            {t("اختر دورك لتعبئة حساب تجريبي، أو أدخل بريدك الخاص إن كان لديك حساب.")}
          </p>

          <div role="radiogroup" aria-label={t("الدور")} className="grid grid-cols-4 gap-2 mt-6">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = role === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => selectRole(opt.role)}
                  className={`pressable flex flex-col items-center justify-center gap-1.5 rounded-xl min-h-16 px-1 text-xs font-semibold leading-tight text-center ${
                    isActive
                      ? "bg-primary text-on-primary shadow-control"
                      : "bg-surface text-muted shadow-control hover:text-foreground hover:bg-surface-sunken"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {t(roleMeta[opt.role].title).replace("بوابة ", "").replace(" Portal", "")}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
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
              <p className="text-[11px] text-muted mt-1.5">{t("كلمة مرور جميع الحسابات التجريبية:")} {DEMO_PASSWORD}</p>
            </div>
            {error && (
              <p role="alert" className="text-sm font-semibold text-danger-700 bg-danger-50 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full mt-1" disabled={submitting}>
              {submitting ? t("جارِ الدخول...") : `${t("الدخول إلى")} ${t(roleMeta[role].title)}`}
            </Button>
          </form>

          <p className="text-center text-xs text-muted mt-6">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              {t("العودة للصفحة الرئيسية")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
