"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
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
import { LogoMark } from "@/components/layout/Logo";
import { PageEnter } from "@/components/motion/PageEnter";
import { CountUp } from "@/components/motion/CountUp";

// Role portals are the product's front doors; owners lead because they are the
// primary audience. Everything else is a utility route into the same app.
const rolePortals = [
  {
    title: "بوابة الملاك",
    desc: "تابع عقاراتك وعقودك وصافي دخلك وطلبات الصيانة في مكان واحد.",
    href: "/login?role=owner",
    icon: ShieldCheck,
  },
  {
    title: "بوابة المستأجرين",
    desc: "اطّلع على عقد الإيجار والفواتير وقدّم طلبات الصيانة.",
    href: "/login?role=tenant",
    icon: KeyRound,
  },
  {
    title: "بوابة فنيي الصيانة",
    desc: "استلم أوامر العمل وحدّث حالتها من الموقع.",
    href: "/login?role=technician",
    icon: Wrench,
  },
] as const;

const tools = [
  { title: "المستخدمون وأدوارهم", desc: "عدد مستخدمي النظام وحالة نشاطهم.", href: "/login?role=admin&next=/admin/users", icon: Users },
  { title: "العقارات والعملاء", desc: "إحصائيات العقارات وقاعدة العملاء.", href: "/login?role=admin&next=/admin/properties", icon: Building2 },
  { title: "العقود الإلكترونية", desc: "أرشيف رقمي للعقود وتواريخ التجديد.", href: "/login?role=admin&next=/admin/contracts", icon: FileText },
  { title: "عروض الأسعار", desc: "إنشاء عروض أسعار وتصديرها PDF.", href: "/login?role=admin&next=/quotes", icon: Receipt },
  { title: "التقارير والفواتير", desc: "تحليلات تفاعلية وتصدير الفواتير.", href: "/login?role=admin&next=/reports", icon: BarChart3 },
  { title: "الخريطة التفاعلية", desc: "جميع العقارات على خريطة بفلاتر ذكية.", href: "/login?role=admin&next=/map", icon: MapPin },
  { title: "خدمة العملاء", desc: "تذاكر الاستفسارات حتى الإغلاق.", href: "/login?role=admin&next=/support/customer", icon: Headset },
  { title: "الدعم الفني", desc: "تذاكر الأعطال التقنية وتوزيعها.", href: "/login?role=admin&next=/support/technical", icon: LifeBuoy },
  { title: "مدير الحساب", desc: "تواصل مباشر مع مدير حسابك.", href: "/login?role=admin&next=/account-manager", icon: UserCog },
] as const;

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
    <div className="min-h-screen bg-background">
      <PageEnter>
        <header className="bg-brand-950 pt-[env(safe-area-inset-top)]">
          <div className="max-w-6xl mx-auto px-5 lg:px-8 min-h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoMark size={34} />
              <span className="text-base font-extrabold text-white">أملاك MS</span>
            </div>
            <Link
              href="/login"
              className="pressable inline-flex items-center min-h-11 sm:min-h-10 px-4 rounded-xl bg-white/10 text-sm font-semibold text-white hover:bg-white/15"
            >
              تسجيل الدخول
            </Link>
          </div>

          <div className="max-w-6xl mx-auto px-5 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
            <div>
              <h1 className="text-4xl lg:text-[3.4rem] font-extrabold leading-[1.15] text-white">
                عقاراتك، عقودك، ودخلك الصافي — بوضوح تام.
              </h1>
              <p className="mt-5 text-base lg:text-lg leading-relaxed text-brand-200 max-w-xl">
                أملاك MS تجمع إدارة العقارات والعقود والتحصيل والصيانة في منصة واحدة، وتعرض للمالك كشف حسابه
                أولًا بأول بعد المصروفات وعمولة الإدارة.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login?role=owner"
                  className="pressable inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-white text-brand-900 font-bold hover:bg-brand-50"
                >
                  دخول الملاك
                  <ArrowLeft size={18} />
                </Link>
                <Link
                  href="/login"
                  className="pressable inline-flex items-center min-h-12 px-5 rounded-xl text-white/90 font-semibold hover:bg-white/10"
                >
                  بقية الأدوار
                </Link>
              </div>
            </div>

            <StatementPreview />
          </div>
        </header>

        {stats.every((x) => x.value > 0) && (
        <section className="max-w-6xl mx-auto px-5 lg:px-8 -mt-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-border shadow-raised">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface px-5 py-5 lg:py-6">
                <CountUp value={String(s.value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)])} className="num block text-3xl font-extrabold text-brand-800" />
                <p className="text-xs font-semibold text-muted mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-16">
          <h2 className="text-2xl font-extrabold">ادخل حسب دورك</h2>
          <p className="text-sm text-muted mt-1.5">كل دور يرى ما يخصه فقط، بصلاحيات واضحة.</p>
          <Link
            href={rolePortals[0].href}
            className="pressable group mt-6 flex items-center gap-5 rounded-2xl bg-brand-700 text-white shadow-raised hover:bg-brand-800 p-6 lg:p-8"
          >
            <span className="h-12 w-12 shrink-0 rounded-xl bg-white/12 grid place-items-center">
              <ShieldCheck size={24} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-bold">{rolePortals[0].title}</span>
              <span className="block text-sm text-brand-100 mt-1.5 leading-relaxed">{rolePortals[0].desc}</span>
            </span>
            <ArrowLeft size={22} className="shrink-0 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] group-hover:-translate-x-1" />
          </Link>
          <ul className="mt-3 grid md:grid-cols-2 gap-3">
            {rolePortals.slice(1).map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.title}>
                  <Link
                    href={p.href}
                    className="pressable group flex items-center gap-4 rounded-2xl bg-surface shadow-card hover:shadow-raised p-4 lg:p-5 min-h-20"
                  >
                    <span className="h-10 w-10 shrink-0 rounded-xl bg-brand-50 text-brand-700 grid place-items-center">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{p.title}</span>
                      <span className="block text-xs text-muted mt-1 leading-relaxed">{p.desc}</span>
                    </span>
                    <ArrowLeft size={18} className="shrink-0 text-muted transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] group-hover:-translate-x-1" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-16 pb-20">
          <h2 className="text-2xl font-extrabold">أدوات الإدارة</h2>
          <p className="text-sm text-muted mt-1.5">اختصارات مباشرة لفريق العمل بعد تسجيل الدخول.</p>
          <ul className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 border-t-2 border-foreground/80">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.title} className="border-b border-border">
                  <Link
                    href={t.href}
                    className="group flex items-center gap-3 py-3 -mx-3 px-3 rounded-xl min-h-14 transition-colors duration-[var(--duration-quick)] hover:bg-surface-sunken"
                  >
                    <Icon size={18} strokeWidth={1.75} className="shrink-0 text-brand-700" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-sm">{t.title}</span>
                      <span className="block text-xs text-muted mt-0.5 truncate">{t.desc}</span>
                    </span>
                    <ArrowLeft
                      size={16}
                      className="text-muted opacity-0 -translate-x-1 transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out)] group-hover:opacity-100 group-hover:translate-x-0"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} أملاك MS — منصة تجريبية لإدارة الأملاك.
        </footer>
      </PageEnter>
    </div>
  );
}

// A synthetic owner statement: shows the product's central promise (net
// income after expenses and management fee) the moment the page loads.
// Figures are illustrative and labelled as such.
function StatementPreview() {
  const rows = [
    { label: "الدخل الإجمالي", value: "٤٨٠٬٠٠٠ ﷼", tone: "text-foreground" },
    { label: "المصروفات", value: "−٦٢٬٤٠٠ ﷼", tone: "text-danger-700" },
    { label: "عمولة الإدارة (٥٪)", value: "−٢٠٬٨٨٠ ﷼", tone: "text-warning-700" },
  ];
  return (
    <div className="rounded-2xl bg-surface text-foreground shadow-raised p-5 lg:p-6" aria-label="مثال على كشف حساب المالك">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted">كشف حساب المالك</p>
          <p className="font-bold mt-1">السنة التعاقدية الحالية</p>
        </div>
        <span className="text-[11px] font-semibold text-muted bg-surface-sunken rounded-full px-2.5 py-1">مثال توضيحي</span>
      </div>
      <dl className="mt-5 divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-3 text-sm">
            <dt className="text-muted">{r.label}</dt>
            <dd className={`num font-bold ${r.tone}`}><bdi dir="ltr">{r.value}</bdi></dd>
          </div>
        ))}
      </dl>
      <div className="mt-1 rounded-xl bg-brand-50 border-t-[5px] border-double border-brand-300 px-4 py-3.5 flex items-center justify-between">
        <span className="text-sm font-bold text-brand-800">صافي الدخل</span>
        <bdi dir="ltr" className="num text-xl font-extrabold text-brand-800">٣٩٦٬٧٢٠ ﷼</bdi>
      </div>
    </div>
  );
}
