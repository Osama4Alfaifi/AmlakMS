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

const roleOptions: { role: Role; icon: typeof ShieldCheck; defaultName: string }[] = [
  { role: "admin", icon: UserCog, defaultName: "مدير النظام" },
  { role: "owner", icon: ShieldCheck, defaultName: owners[0].name },
  { role: "tenant", icon: KeyRound, defaultName: tenants[0].name },
  { role: "technician", icon: Wrench, defaultName: technicians[0].name },
];

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const preselected = params.get("role") as Role | null;
  const next = params.get("next");

  const [role, setRole] = useState<Role>(preselected ?? "admin");
  const active = roleOptions.find((r) => r.role === role)!;
  const [name, setName] = useState(active.defaultName);

  function selectRole(r: Role) {
    setRole(r);
    setName(roleOptions.find((o) => o.role === r)!.defaultName);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(role, name.trim() || active.defaultName);
    router.push(next || roleMeta[role].homeHref);
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
            بيئة تجريبية بالكامل — اختر دورك للدخول مباشرة دون الحاجة لكلمة مرور حقيقية.
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
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني (تجريبي)</Label>
              <Input id="email" type="email" defaultValue={`${role}@amlakms.sa`} disabled />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" placeholder="••••••••" defaultValue="demo1234" />
            </div>
            <Button type="submit" className="w-full mt-2">
              الدخول إلى {roleMeta[role].title}
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
