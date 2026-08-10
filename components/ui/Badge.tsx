import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-700",
  brand: "bg-brand-50 text-brand-700",
  neutral: "bg-background text-muted",
};

const STATUS_TONE: Record<string, Tone> = {
  "نشط": "success",
  "مدفوعة": "success",
  "مكتمل": "success",
  "مقبول": "success",
  "متاحة": "success",
  "مغلقة": "neutral",
  "معلقة": "warning",
  "قيد التنفيذ": "warning",
  "قيد المعالجة": "warning",
  "قيد التجديد": "warning",
  "جديد": "info",
  "مفتوحة": "info",
  "مرسل": "info",
  "مؤجرة": "info",
  "متأخرة": "danger",
  "منتهي": "danger",
  "مرفوض": "danger",
  "تحت الصيانة": "danger",
  "مباعة": "brand",
  "عاجل": "danger",
  "متوسط": "warning",
  "منخفض": "neutral",
  "مسودة": "neutral",
};

export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  const resolvedTone = tone ?? (typeof children === "string" ? STATUS_TONE[children] : undefined) ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        toneClasses[resolvedTone],
        className
      )}
    >
      {children}
    </span>
  );
}
