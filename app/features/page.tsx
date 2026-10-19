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
  MapPin,
  Receipt,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";
import { LangToggle, ThemeToggle } from "@/components/layout/Toggles";
import { PageEnter } from "@/components/motion/PageEnter";
import { CheckIcon } from "@/components/ui/icons";
import { useLanguage } from "@/lib/i18n";

interface Feature {
  id: string;
  icon: typeof Building2;
  title: string;
  summary: string;
  points: string[];
}

const features: Feature[] = [
  {
    id: "statement",
    icon: FileScan,
    title: "كشف حساب المالك",
    summary: "يرى المالك دخله الحقيقي بوضوح: كم دخل، وكم صُرف، وكم تأخذ الإدارة، وكم يبقى له.",
    points: [
      "الدخل الإجمالي من العقود النشطة على عقاراتك",
      "المصروفات المسجلة على عقاراتك، مع تفصيل بنودها",
      "عمولة الإدارة بنسبة واضحة، وصافي الدخل بعدها",
      "طباعة كشف الحساب أو حفظه بصيغة PDF",
    ],
  },
  {
    id: "properties",
    icon: Building2,
    title: "العقارات والوحدات",
    summary: "كل عقار وما بداخله من وحدات في مكان واحد، حتى العقار الذي لا وحدات له يُعامل كوحدة واحدة.",
    points: [
      "بيانات العقار: النوع والموقع والمساحة ونوع الصك وتاريخ إصداره",
      "وحدات كل عقار بطابقها ومساحتها وغرفها ومرافقها بالعدد",
      "أرقام عدادات الكهرباء والمياه، ومن يتحمل فاتورتها",
      "حالة كل وحدة: مؤجرة أو شاغرة أو تحت الصيانة",
    ],
  },
  {
    id: "contracts",
    icon: FileText,
    title: "عقود إلكترونية",
    summary: "أنشئ العقد بنفسك أو استورده من ملف عقد إيجار، وتابع مدته وتجديده.",
    points: [
      "استيراد عدة عقود إيجار دفعة واحدة من ملفات PDF",
      "دورة الدفع: شهري أو ربع سنوي أو نصف سنوي أو سنوي",
      "أشهر السماح ورسوم الماء والكهرباء الثابتة",
      "تنبيه قبل انتهاء العقد، وتتبّع حالته",
    ],
  },
  {
    id: "payments",
    icon: CalendarClock,
    title: "جدولة الدفعات والتحصيل",
    summary: "لكل عقد جدول دفعات جاهز، وترى فورًا ما سُدّد وما تأخر وما اقترب موعده.",
    points: [
      "جدول دفعات يُنشأ تلقائيًا من بيانات العقد",
      "تسديد الدفعات وتحديث حالتها",
      "إظهار الدفعات المتأخرة على الوحدة والعقار",
      "تقرير بالدفعات القادمة لتخطيط التحصيل",
    ],
  },
  {
    id: "maintenance",
    icon: Wrench,
    title: "طلبات الصيانة",
    summary: "من بلاغ المستأجر إلى إغلاق الطلب، وكل طرف يتابع ما يخصه.",
    points: [
      "يرفع المستأجر الطلب من حسابه",
      "إسناد الطلب إلى فني أو مورّد وتحديد أولويته",
      "متابعة الحالة: جديد، قيد التنفيذ، مكتمل",
      "يرى المالك الطلبات والمصروفات على عقاراته",
    ],
  },
  {
    id: "documents",
    icon: Receipt,
    title: "مستندات وفواتير وسندات",
    summary: "كل ما يخص عقارك من أوراق في مكان واحد، وجاهز للطباعة والمشاركة.",
    points: [
      "فواتير وسندات قبض وصرف وعروض أسعار بصيغة PDF",
      "مستندات مرتبطة بالعقار أو بوحداته أو بعقوده",
      "صكوك الملكية والتأمين وصور العقود بروابط مباشرة",
      "بحث وتصنيف المستندات بحسب نوعها",
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "تقارير مالية",
    summary: "أرقام واضحة ورسوم بيانية لتفهم أداء عقاراتك واتخاذ القرار.",
    points: [
      "الإيرادات والمصروفات الشهرية في رسم بياني",
      "الدخل حسب العقار وتوزيع العقارات",
      "تقارير مالية لفريق الإدارة والمحاسبة",
      "تصدير البيانات إلى Excel وCSV",
    ],
  },
  {
    id: "map",
    icon: MapPin,
    title: "الخريطة التفاعلية",
    summary: "شاهد مواقع عقاراتك على الخريطة وتصفّحها بسهولة.",
    points: [
      "كل العقارات على خريطة واحدة بألوان مميزة",
      "فلاتر للمدينة والحالة",
      "تحديد موقع العقار بدقة عند إضافته",
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    title: "إشعارات ذكية",
    summary: "لا يفوتك موعد مهم: التنبيهات تظهر لك تلقائيًا في جرس الإشعارات.",
    points: [
      "عقود قاربت على الانتهاء",
      "دفعات اقترب استحقاقها",
      "اقتراب انتهاء إدارة العقار أو هوية المستأجر",
      "إخفاء ما انتهيت منه بضغطة",
    ],
  },
  {
    id: "roles",
    icon: ShieldCheck,
    title: "صلاحيات حسب الدور",
    summary: "كل شخص يرى ما يخصه فقط، بحسابه وصلاحياته.",
    points: [
      "أدوار جاهزة: مدير، محاسب، وسيط، مالك، مستأجر، فني، فريق صيانة",
      "أدوار مخصصة بصلاحيات تختارها أنت",
      "المحاسب والوسيط يعملان على الملاك المرتبطين بهما فقط",
      "سجل تدقيق لعمليات النظام",
    ],
  },
];

export default function FeaturesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <PageEnter>
        <header className="bg-hero text-hero-fg pt-[env(safe-area-inset-top)]">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 min-h-16 flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-3">
              <LogoMark size={34} />
              <span className="text-base font-extrabold">{t("أملاك MS")}</span>
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle tone="hero" />
              <LangToggle tone="hero" />
              <Link
                href="/login"
                className="pressable inline-flex items-center min-h-11 sm:min-h-10 px-4 rounded-xl bg-surface text-sm font-semibold text-foreground shadow-control hover:bg-surface-sunken ms-1"
              >
                {t("تسجيل الدخول")}
              </Link>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-8 pb-12 lg:pt-12 lg:pb-16">
            <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight">{t("ميزات أملاك MS")}</h1>
            <p className="mt-4 text-lg text-hero-muted max-w-2xl leading-relaxed">
              {t("كل ما يمكنك فعله في النظام، بالتفصيل وبدون تعقيد.")}
            </p>
            <nav aria-label={t("الميزات")} className="mt-6 flex flex-wrap gap-2">
              {features.map((f) => (
                <a
                  key={f.id}
                  href={`#${f.id}`}
                  className="pressable inline-flex items-center min-h-10 px-3.5 rounded-full bg-surface/70 text-sm font-semibold text-foreground hover:bg-surface"
                >
                  {t(f.title)}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 lg:px-6 py-10 lg:py-14 flex flex-col gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <section
                key={f.id}
                id={f.id}
                className="scroll-mt-6 rounded-3xl bg-surface shadow-card p-5 lg:p-8 grid lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-10"
              >
                <div>
                  <span className="h-12 w-12 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center">
                    <Icon size={24} strokeWidth={1.75} />
                  </span>
                  <h2 className="mt-4 text-2xl font-extrabold">{t(f.title)}</h2>
                  <p className="mt-2 text-muted leading-relaxed">{t(f.summary)}</p>
                </div>
                <ul className="flex flex-col gap-3 self-center">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-success-50 text-success-700 grid place-items-center">
                        <CheckIcon width={14} height={14} strokeWidth={2.5} />
                      </span>
                      <span className="leading-relaxed">{t(p)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="mt-4 rounded-3xl bg-hero text-hero-fg text-center px-6 py-12 lg:py-16">
            <h2 className="text-2xl lg:text-4xl font-extrabold">{t("جاهز تشوف عقاراتك بوضوح؟")}</h2>
            <Link
              href="/login"
              className="pressable mt-6 inline-flex items-center justify-center gap-2 min-h-14 px-10 rounded-2xl bg-cta text-cta-fg text-lg font-bold shadow-control hover:opacity-90"
            >
              {t("تسجيل الدخول")}
              <ArrowLeft size={20} className="ltr:rotate-180" />
            </Link>
            <p className="mt-5">
              <Link href="/" className="text-sm font-semibold text-hero-muted hover:underline">
                {t("العودة للصفحة الرئيسية")}
              </Link>
            </p>
          </div>
        </main>
      </PageEnter>
    </div>
  );
}
