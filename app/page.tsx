"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BarChart3,
  Building2,
  CalendarClock,
  FileScan,
  FileText,
  LayoutDashboard,
  MapPin,
  Receipt,
  Settings,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";
import { LangToggle, ThemeToggle } from "@/components/layout/Toggles";
import { PageEnter } from "@/components/motion/PageEnter";
import { useLanguage } from "@/lib/i18n";

const features = [
  { icon: FileScan, title: "كشف حساب المالك", desc: "الدخل والمصروفات وعمولة الإدارة وصافي الدخل في كشف واضح قابل للطباعة." },
  { icon: Building2, title: "إدارة العقارات والوحدات", desc: "سجّل العقارات ووحداتها وبيانات العدادات والمرافق، وحدّث العروض والأسعار." },
  { icon: FileText, title: "عقود إلكترونية", desc: "أنشئ العقود أو استوردها من ملف عقد إيجار، وتابع التجديد والانتهاء." },
  { icon: CalendarClock, title: "جدولة الدفعات والتحصيل", desc: "جدول دفعات لكل عقد، مع تسديد الدفعات وتنبيه بالمتأخرات." },
  { icon: Wrench, title: "طلبات الصيانة", desc: "يرفع المستأجر الطلب ويُسنَد إلى فني ويُتابَع حتى الإغلاق." },
  { icon: Receipt, title: "فواتير وسندات وعروض أسعار", desc: "مستندات PDF جاهزة للطباعة والمشاركة بضغطة واحدة." },
  { icon: BarChart3, title: "تقارير مالية", desc: "تحليلات ورسوم بيانية وتصدير إلى Excel وCSV." },
  { icon: MapPin, title: "الخريطة التفاعلية", desc: "كل عقاراتك على خريطة واحدة مع فلاتر للمدينة والحالة." },
  { icon: Bell, title: "إشعارات ذكية", desc: "تنبيه قبل انتهاء العقود وعند استحقاق الدفعات." },
  { icon: ShieldCheck, title: "صلاحيات حسب الدور", desc: "مدير ومحاسب ووسيط ومالك ومستأجر وفني، وكل طرف يرى ما يخصه فقط." },
  { icon: LayoutDashboard, title: "ويب وجوال", desc: "يعمل من المتصفح ومن تطبيق أندرويد بنفس الحساب." },
  { icon: Settings, title: "عربي وإنجليزي، نهاري وليلي", desc: "واجهة تدعم اللغتين والوضعين لراحة العين في أي وقت." },
] as const;


export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <PageEnter>
        <header className="bg-brand-950 text-white pt-[env(safe-area-inset-top)]">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 min-h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <LogoMark size={34} />
              <span className="text-base font-extrabold">{t("أملاك MS")}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle tone="onDark" />
              <LangToggle tone="onDark" />
              <Link
                href="/login"
                className="pressable inline-flex items-center min-h-11 sm:min-h-10 px-4 rounded-xl bg-white/12 text-sm font-semibold text-white hover:bg-white/20 ms-1"
              >
                {t("تسجيل الدخول")}
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-8 pb-14 lg:pt-14 lg:pb-20 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-12 items-center">
            <div>
              <h1 className="text-[2.2rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.2]">
                {t("أدِر عقاراتك بثقة، وتابع دخلك لحظة بلحظة")}
              </h1>
              <p className="mt-5 text-base lg:text-lg leading-relaxed text-white/80 max-w-xl">
                {t("منصة واحدة تجمع العقارات والعقود والتحصيل والصيانة والتقارير، بصلاحيات واضحة لكل دور، على الجوال والمتصفح.")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login?role=owner"
                  className="pressable inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-white text-brand-950 font-bold hover:bg-white/90"
                >
                  {t("ابدأ الآن")}
                  <ArrowLeft size={18} className="ltr:rotate-180" />
                </Link>
                <Link
                  href="#features"
                  className="pressable inline-flex items-center min-h-12 px-5 rounded-xl text-white font-semibold hover:bg-white/10"
                >
                  {t("اكتشف الميزات")}
                </Link>
              </div>
            </div>

            <Skyline />
          </div>
        </header>

        <section id="features" className="max-w-7xl mx-auto px-4 lg:px-6 pt-14 lg:pt-20 scroll-mt-4">
          <h2 className="text-2xl lg:text-3xl font-extrabold">{t("كل ما تحتاجه لإدارة أملاكك")}</h2>
          
          <div className="mt-6 rounded-2xl bg-surface shadow-card p-3 sm:p-5">
            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-1">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.title} className="flex items-center gap-2.5 py-2.5">
                    <span className="h-9 w-9 shrink-0 rounded-xl bg-brand-100 text-brand-700 grid place-items-center">
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className="font-semibold leading-snug">{t(f.title)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 lg:px-6 pt-14 lg:pt-20 pb-16">
          <div className="rounded-3xl bg-brand-950 text-white px-6 py-10 lg:px-12 lg:py-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl lg:text-3xl font-extrabold">{t("جاهز تشوف عقاراتك بوضوح؟")}</h2>
              <p className="mt-2 text-white/75">{t("سجّل الدخول وابدأ بإدارة عقاراتك وعقودك ودخلك من مكان واحد.")}</p>
            </div>
            <Link
              href="/login"
              className="pressable inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-xl bg-white text-brand-950 font-bold hover:bg-white/90 self-start lg:self-auto"
            >
              {t("تسجيل الدخول")}
              <ArrowLeft size={18} className="ltr:rotate-180" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} {t("أملاك MS")} — {t("نسخة تجريبية ببيانات وهمية.")}
        </footer>
      </PageEnter>
    </div>
  );
}

// Authored skyline: a few towers in petrol tones with a handful of lit brass
// windows. Positions and lit windows are derived from fixed numbers, so the
// server and client always render the same picture.
function Skyline() {
  const towers = [
    { x: 18, w: 70, h: 150, fill: "#123846" },
    { x: 100, w: 88, h: 250, fill: "#164557" },
    { x: 200, w: 64, h: 190, fill: "#123846" },
    { x: 276, w: 104, h: 300, fill: "#1b5468" },
    { x: 392, w: 72, h: 210, fill: "#164557" },
    { x: 474, w: 52, h: 130, fill: "#123846" },
  ];
  const ground = 340;
  return (
    <svg viewBox="0 0 544 360" className="w-full h-auto" role="img" aria-label="">
      <rect x="0" y={ground} width="544" height="2" fill="#ffffff" fillOpacity="0.18" />
      {towers.map((b, bi) => {
        const top = ground - b.h;
        const cols = Math.floor((b.w - 16) / 18);
        const rows = Math.floor((b.h - 20) / 24);
        return (
          <g key={bi}>
            <rect x={b.x} y={top} width={b.w} height={b.h} rx="4" fill={b.fill} />
            {Array.from({ length: rows }).flatMap((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const lit = (bi * 7 + r * 5 + c * 3) % 11 === 0;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={b.x + 10 + c * 18}
                    y={top + 14 + r * 24}
                    width="9"
                    height="12"
                    rx="2"
                    fill={lit ? "#d6a84e" : "#ffffff"}
                    fillOpacity={lit ? 0.95 : 0.1}
                  />
                );
              })
            )}
          </g>
        );
      })}
    </svg>
  );
}
