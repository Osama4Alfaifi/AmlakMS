import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "info" | "accent";
  trend?: { value: string; positive: boolean };
}

const toneClasses = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  info: "bg-info-50 text-info-700",
  accent: "bg-accent-400/15 text-accent-600",
};

export function StatCard({ label, value, icon: Icon, tone = "brand", trend }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm shadow-black/[0.03] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", toneClasses[tone])}>
          <Icon className="h-4.5 w-4.5" size={18} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-extrabold text-foreground">{value}</span>
        {trend && (
          <span className={cn("text-xs font-semibold pb-1", trend.positive ? "text-success-700" : "text-danger-700")}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
