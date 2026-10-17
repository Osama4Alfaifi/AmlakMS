import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/icons";
import { CountUp } from "@/components/motion/CountUp";
import { getLang } from "@/lib/i18n/state";
import { translate } from "@/lib/i18n/translate";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "info" | "accent";
  trend?: { value: string; positive: boolean };
}

// The tone only colours the glyph and its soft well; the figure itself stays
// in ink so a row of cards reads as data first, decoration second.
const toneClasses = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-info-50 text-info-700",
  accent: "bg-accent-400/15 text-accent-600",
};

const ARABIC = "٠١٢٣٤٥٦٧٨٩";
// One numeral system app-wide: currency() already formats in Arabic-Indic digits.
const toArabicDigits = (v: string) => (getLang() === "en" ? v : v.replace(/\d/g, (d) => ARABIC[Number(d)]));

export function StatCard({ label, value, icon: Icon, tone = "brand", trend }: StatCardProps) {
  return (
    <div className="bg-surface rounded-2xl p-3.5 lg:p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-muted leading-snug pt-1">{translate(label)}</p>
        <div className={cn("h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0", toneClasses[tone])}>
          <Icon size={17} strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <CountUp
          value={toArabicDigits(value)}
          className="num text-[1.45rem] leading-tight font-extrabold text-foreground tracking-tight whitespace-nowrap"
        />
        {trend && (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", trend.positive ? "text-success-700" : "text-danger-700")}>
            {trend.positive ? <ArrowUpIcon width={12} height={12} strokeWidth={2.25} /> : <ArrowDownIcon width={12} height={12} strokeWidth={2.25} />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
