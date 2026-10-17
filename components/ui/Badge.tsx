import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

// Each tone pairs a tinted ground with a darkened text colour of the same hue
// (≥4.5:1) and a small dot, so status never relies on colour alone.
const toneClasses: Record<Tone, { chip: string; dot: string }> = {
  success: { chip: "bg-success-50 text-success-700", dot: "bg-success-500" },
  warning: { chip: "bg-warning-50 text-warning-700", dot: "bg-warning-500" },
  danger: { chip: "bg-danger-50 text-danger-700", dot: "bg-danger-500" },
  info: { chip: "bg-info-50 text-info-700", dot: "bg-info-500" },
  brand: { chip: "bg-brand-50 text-brand-800", dot: "bg-brand-500" },
  neutral: { chip: "bg-surface-sunken text-muted", dot: "bg-muted/60" },
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
  const t = toneClasses[resolvedTone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap",
        t.chip,
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full shrink-0", t.dot)} />
      {children}
    </span>
  );
}
