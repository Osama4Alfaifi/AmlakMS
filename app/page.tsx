"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  Contact,
  FileText,
  Headset,
  KeyRound,
  LifeBuoy,
  MapPin,
  Receipt,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { useClients, useContracts, useProperties, useSystemUsers } from "@/lib/firestore/hooks";

const portals = [
  {
    title: "عدد المستخدمين",
    desc: "لوحة KPI لعدد مستخدمي النظام وأدوارهم وحالة نشاطهم.",
    href: "/login?role=admin&next=/admin/users",
    icon: Users,
    tone: "brand",
  },
  {
    title: "العقارات والعقود والعملاء",
    desc: "إحصائيات وتحليلات شاملة للعقارات والعقود وقاعدة العملاء.",
    href: "/login?role=admin&next=/admin/properties",
    icon: Building2,
    tone: "brand",
  },
  {
    title: "دخول ملاك العقار",
    desc: "متابعة العقارات المملوكة، العقود، الدخل، وطلبات الصيانة.",
    href: "/login?role=owner",
    icon: ShieldCheck,
    tone: "info",
  },
  {
    title: "دخول المستأجرين",
    desc: "عرض عقد الإيجار، الفواتير، وتقديم طلبات الصيانة.",
    href: "/login?role=tenant",
    icon: KeyRound,
    tone: "info",
  },
  {
    title: "دخول فنيي الصيانة",
    desc: "استلام أوامر العمل وتحديث حالة طلبات الصيانة ميدانيًا.",
    href: "/login?role=technician",
    icon: Wrench,
    tone: "warning",
  },
  {
    title: "تصدير عروض الأسعار",
    desc: "إنشاء عروض أسعار احترافية وتصديرها كملف PDF للعملاء.",
    href: "/login?role=admin&next=/quotes",
    icon: Receipt,
    tone: "accent",
  },
  {
    title: "تصدير التقارير والفواتير",
    desc: "لوحة تحليلات BI تفاعلية وتصدير الفواتير والتقارير المالية.",
    href: "/login?role=admin&next=/reports",
    icon: BarChart3,
    tone: "accent",
  },
  {
    title: "خدمة العملاء",
    desc: "إدارة تذاكر استفسارات العملاء ومتابعتها حتى الإغلاق.",
    href: "/login?role=admin&next=/support/customer",
    icon: Headset,
    tone: "success",
  },
  {
    title: "الدعم الفني",
    desc: "إدارة تذاكر الأعطال التقنية وتوزيعها على فريق الدعم.",
    href: "/login?role=admin&next=/support/technical",
    icon: LifeBuoy,
    tone: "success",
  },
  {
    title: "مدير الحساب",
    desc: "تواصل مباشر مع مدير الحساب المخصص لمتابعة احتياجاتك.",
    href: "/login?role=admin&next=/account-manager",
    icon: UserCog,
    tone: "brand",
  },
  {
    title: "الخريطة التفاعلية",
    desc: "استعراض جميع العقارات على خريطة تفاعلية مع فلاتر ذكية.",
    href: "/login?role=admin&next=/map",
    icon: MapPin,
    tone: "info",
  },
  {
    title: "العقود الإلكترونية",
    desc: "أرشيف رقمي لكل العقود مع حالتها وتواريخ التجديد.",
    href: "/login?role=admin&next=/admin/contracts",
    icon: FileText,
    tone: "warning",
  },
] as const;

const toneClasses: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  info: "bg-info-50 text-info-700",
  warning: "bg-warning-50 text-warning-700",
  success: "bg-success-50 text-success-700",
  accent: "bg-accent-400/15 text-accent-600",
};

export default function LandingPage() {
  const { data: properties } = useProperties();
  const { data: contracts } = useContracts();
  const { data: clients } = useClients();
  const { data: systemUsers } = useSystemUsers();

  const stats = [
    { label: "عقار مُدار", value: properties.length },
    { label: "عقد نشط", value: contracts.filter((c) => c.status === "نشط").length },
    { label: "عميل مسجل", value: clients.length },
    { label: "مستخدم نظام", value: systemUsers.length },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 min-h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Building2 size={18} />
            </div>
            <span className="text-base font-extrabold">أملاك MS</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors rounded-lg px-4 py-2"
          >
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 lg:px-8 pt-14 pb-10 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 rounded-full px-3 py-1.5 mb-5">
          نسخة تجريبية · بيانات وهمية للعرض فقط
        </span>
        <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight max-w-3xl mx-auto">
          منصة <span className="text-brand-600">أملاك MS</span> الشاملة لإدارة الأملاك
        </h1>
        <p className="text-muted text-sm lg:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
          نظام موحّد يجمع كل بوابات إدارة العقارات: من لوحات تحكم المدير وتحليلات الأعمال، إلى بوابات الملاك
          والمستأجرين والفنيين، وصولًا إلى تصدير العروض والفواتير والخريطة التفاعلية — بتحليلات ورسوم بيانية بأسلوب PowerBI.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 lg:px-8 mb-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-2xl p-5 text-center shadow-sm shadow-black/[0.03]">
              <p className="text-2xl lg:text-3xl font-extrabold text-brand-700">{s.value}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-20">
        <h2 className="text-xl font-extrabold mb-1">بوابات النظام</h2>
        <p className="text-sm text-muted mb-6">اختر البوابة المناسبة لدورك للدخول إلى لوحة التحكم الخاصة بك</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.title}
                href={p.href}
                className="group bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm shadow-black/[0.03] hover:shadow-md hover:border-brand-300 transition-all"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${toneClasses[p.tone]}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm group-hover:text-brand-700 transition-colors">{p.title}</h3>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} أملاك MS — منصة تجريبية لإدارة الأملاك.
      </footer>
    </div>
  );
}
